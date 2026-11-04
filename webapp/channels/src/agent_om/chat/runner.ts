// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-underscore-dangle -- window.__semanticUI is where the Agent Object Model's consumers find the projector */

import {indexNodes, presentedPage, siteOutline, StepFailed} from '@agent-om/agent';
import type {AgentEvent, AgentPage, AgentResult} from '@agent-om/agent';
import {CLAUDE_LIMITS, HAIKU, projectionView, runClaude} from '@agent-om/agent/claude';
import type {SemanticProjector} from '@agent-om/core';

import {loadSitemap} from './load_sitemap';
import {createTranscript, saveTranscript, secretFields} from './transcript';
import type {Totals} from './transcript';

// Claude Haiku on the app's projection, run in the app's own window (the
// frame, index.tsx): the loop, tools and view the Agent Object Model's agent
// package gives every host. The runner keeps the run's progress for the chat
// panel, which shows it from the window above, and settles what the run asks
// the user (a risky step, a secret).

/** The Anthropic key, in the dev server only (webpack.config.js, from ANTHROPIC_API_KEY). */
const API_KEY = process.env.AGENT_OM_ANTHROPIC_KEY || ''; // eslint-disable-line no-process-env

export type ChatStep = {step: number; text: string; ok?: boolean; detail?: string};

export type ChatView = {
    status: 'idle' | 'running' | 'done' | 'blocked' | 'stopped' | 'failed';
    query: string;
    steps: ChatStep[];
    thinking: boolean;

    /** the last read of held-back content, until the next action */
    reading?: string;
    message?: string;

    /** Claude's answer */
    text?: string;

    /** a risky step waits for the user's yes */
    confirm?: string;

    /** a secret field waits for the user's value; it goes to the page, never to the model */
    secret?: string;

    /** at the end: time, requests, tokens and cost */
    totals?: Totals;
};

export const IDLE: ChatView = {status: 'idle', query: '', steps: [], thinking: false};

/** What the chat panel calls, from the window above the app's. */
export type ChatRunner = {
    view: () => ChatView;

    /** the listener gets the view each time it changes; returns what stops it */
    subscribe: (listener: (view: ChatView) => void) => () => void;
    start: (query: string) => void;
    stop: () => void;
    clear: () => void;
    respond: (ok: boolean) => void;
    enterSecret: (value: string | null) => void;
    whatClaudeSees: () => Promise<string>;
};

declare global {
    interface Window {
        __agentOmChat?: ChatRunner;
    }
}

/** No host UI to skip: the chat is in the window above, not on the page. */
const EXCLUDE: ReadonlySet<string> = new Set();

/** The element a node id names, read from a fresh snapshot (the executor's targets). */
function nodeResolver(projector: SemanticProjector) {
    return (id: string) => {
        projector.snapshot();
        return projector.resolve(id);
    };
}

/**
 * A step on an element that isn't on the page fails at once instead of after
 * the executor's wait for it to appear: Claude's view waited for the page to
 * settle, so an id still not there is a mistyped guess.
 */
function failFast(page: AgentPage, projector: SemanticProjector): AgentPage {
    return {
        ...page,
        async act(step, signal) {
            const id = 'target' in step && typeof step.target === 'string' ? step.target : undefined;
            if (id && !indexNodes(projector.snapshot().root).has(id)) {
                throw new StepFailed('not-found', `${id} is not on the page`);
            }
            return page.act(step, signal);
        },
    };
}

/** The current page as Claude reads it (read_page in full), and the projector's warnings. */
async function whatClaudeSees(): Promise<string> {
    const projector = window.__semanticUI;
    if (!projector) {
        return 'The projector is not running.';
    }
    const page = presentedPage(projector, nodeResolver(projector));
    const view = projectionView({
        snapshot: () => page.observe(),
        now: () => page.snapshot(),
        run: async () => ({ok: false, reason: 'view-only', message: 'Not run.'}),
        exclude: EXCLUDE,
    });
    const warnings = (window.__semanticWarnings ?? []).map((w) => `${w.code}: ${w.message}`);
    return [
        await view.view(true),
        '',
        warnings.length ? `Warnings (${warnings.length}):\n${warnings.join('\n')}` : 'No warnings.',
    ].join('\n');
}

export function createChatRunner(): ChatRunner {
    let view: ChatView = IDLE;
    const listeners = new Set<(view: ChatView) => void>();
    let abort: AbortController | null = null;
    let pendingConfirm: ((ok: boolean) => void) | null = null;
    let pendingSecret: ((value: string | null) => void) | null = null;

    const set = (next: ChatView) => {
        view = next;
        listeners.forEach((listener) => listener(view));
    };
    const settlePrompts = () => {
        pendingConfirm?.(false);
        pendingSecret?.(null);
    };

    async function start(query: string) {
        abort?.abort();
        settlePrompts();
        const projector = window.__semanticUI;
        if (!API_KEY || !projector) {
            const message = API_KEY ? 'The projector is not running.' : 'No Anthropic key: start the dev server with ANTHROPIC_API_KEY set.';
            set({...IDLE, status: 'failed', query, message});
            return;
        }
        const controller = new AbortController();
        abort = controller;

        // Only the current run updates the view.
        const update = (patch: Partial<ChatView> | ((v: ChatView) => Partial<ChatView>)) => {
            if (abort !== controller) {
                return;
            }
            set({...view, ...(typeof patch === 'function' ? patch(view) : patch)});
        };
        set({...IDLE, status: 'running', query});
        const record = createTranscript(query, HAIKU);

        const confirm = (prompt: string) => new Promise<boolean>((resolve) => {
            pendingConfirm = (ok) => {
                pendingConfirm = null;
                record.confirm(prompt, ok);
                update({confirm: undefined});
                resolve(ok);
            };
            update({confirm: prompt, thinking: false});
        });
        const askSecret = (field: string) => new Promise<string | null>((resolve) => {
            pendingSecret = (value) => {
                pendingSecret = null;
                record.secret(field, value !== null);
                update({secret: undefined});
                resolve(value);
            };
            update({secret: field, thinking: false});
        });
        const onEvent = (e: AgentEvent) => {
            record.event(e);
            if (e.type === 'deciding' || e.type === 'writing') {
                update({thinking: true});
            } else if (e.type === 'reading') {
                update({thinking: true, reading: e.description});
            } else if (e.type === 'acting') {
                update((v) => ({thinking: false, reading: undefined, steps: [...v.steps, {step: e.step, text: e.description}]}));
            } else if (e.type === 'result') {
                update((v) => {
                    const known = v.steps.some((s) => s.step === e.step);
                    const steps = known ? v.steps : [...v.steps, {step: e.step, text: e.detail}];
                    return {steps: steps.map((s) => (s.step === e.step ? {...s, ok: e.ok, detail: e.detail} : s))};
                });
            }
        };

        const page = presentedPage(projector, nodeResolver(projector));
        let result: AgentResult;
        try {
            // the app's map, with where the run starts marked
            const sitemap = await loadSitemap(controller.signal);
            const here = new URL(window.location.href);
            result = await runClaude({
                query,
                siteOutline: sitemap && siteOutline(sitemap, here.pathname, Object.fromEntries(here.searchParams)),
                apiKey: API_KEY,
                page: failFast(page, projector),
                exclude: EXCLUDE,
                confirm,
                askSecret,
                onEvent,
                log: (type, data) => record.claude(type, data, secretFields(projector)),

                // saved after each request, so a run that hangs still leaves a record
                onRequest: (r) => {
                    record.request(r);
                    saveTranscript(record.transcript);
                },

                // 3x the benchmark's limits, for long tasks tried by hand
                limits: {actions: CLAUDE_LIMITS.actions * 3, modelCalls: CLAUDE_LIMITS.modelCalls * 3},
                signal: controller.signal,
            });
        } catch (e) {
            result = {status: 'failed', message: e instanceof Error ? e.message : String(e)};
        }
        record.result(result);
        saveTranscript(record.transcript);
        update({...result, totals: record.transcript.totals, thinking: false, reading: undefined, confirm: undefined, secret: undefined});
        if (abort === controller) {
            abort = null;
        }
    }

    const stop = () => {
        abort?.abort();
        settlePrompts();
    };

    return {
        view: () => view,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        start: (query) => {
            start(query);
        },
        stop,
        clear: () => {
            stop();
            abort = null;
            set(IDLE);
        },
        respond: (ok) => pendingConfirm?.(ok),
        enterSecret: (value) => pendingSecret?.(value),
        whatClaudeSees,
    };
}
