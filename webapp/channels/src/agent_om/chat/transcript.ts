// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {indexNodes, isSecretField} from '@agent-om/agent';
import type {AgentEvent, AgentResult} from '@agent-om/agent';
import type {ClaudeRequest} from '@agent-om/agent/claude';
import type {SemanticProjector} from '@agent-om/core';

// A record of one chat run, for debugging, in the Agent Object Model
// dashboard's format: each of Claude's replies and requests, every step and its
// result, every question put to the user, and the outcome. A secret the user
// enters never reaches it: only that it was asked for, and whether it was
// entered. Nor does text Claude tries to type into a secret field. The dev
// server writes it to transcripts/ (webpack.config.js), after each request and
// at the end, so a run that hangs still leaves a record.

export type TranscriptEntry =
    | {type: 'event'; at: number; event: AgentEvent} |
    {type: 'confirm'; at: number; prompt: string; ok: boolean} |

    /** the user was asked for a secret field's secret; `entered`: they gave one (never what) */
    {type: 'secret'; at: number; field: string; entered: boolean} |

    /** what the loop logged (its prompt, each reply: text and tool calls; a secret field's text left out) */
    {type: 'claude'; at: number; event: string; data: Record<string, unknown>} |

    /** a request, its time and the SDK's retries, its tokens and what they cost, or its error */
    {type: 'request'; at: number; ms: number; retries: number; usage?: Usage; costUsd?: number; error?: string};

/** A request's tokens: input not read from or written to the cache, output, cache reads and writes. */
export type Usage = {input: number; output: number; cacheRead: number; cacheWrite: number};

/** The run in numbers: wall time, time waiting on Claude, requests, tokens and cost. */
export type Totals = {ms: number; modelMs: number; requests: number; usage: Usage; costUsd: number};

/**
 * Claude Haiku 5.5's prices, USD per million tokens (as the Agent Object
 * Model's benchmark prices it): up to 100K input tokens per request, and
 * above, where every token of the request (output too) pays the long rate.
 */
const HAIKU_PRICES = {
    base: {input: 0.1, output: 0.5, cacheWrite: 0.125, cacheRead: 0.01},
    long: {input: 0.5, output: 2.5, cacheWrite: 0.625, cacheRead: 0.05},
};
const LONG_PROMPT = 100_000;

function costOf(u: Usage) {
    const r = u.input + u.cacheRead + u.cacheWrite > LONG_PROMPT ? HAIKU_PRICES.long : HAIKU_PRICES.base;
    return ((u.input * r.input) + (u.output * r.output) + (u.cacheWrite * r.cacheWrite) + (u.cacheRead * r.cacheRead)) / 1e6;
}

function usageOf(r: ClaudeRequest): Usage | undefined {
    const u = r.reply?.usage;
    if (!u) {
        return undefined;
    }
    return {
        input: u.input_tokens ?? 0,
        output: u.output_tokens ?? 0,
        cacheRead: u.cache_read_input_tokens ?? 0,
        cacheWrite: u.cache_creation_input_tokens ?? 0,
    };
}

export type Transcript = {
    query: string;
    model: string;

    /** where the run started */
    path: string;
    startedAt: string;
    entries: TranscriptEntry[];
    result?: AgentResult;

    /** at the end: time, tokens and cost */
    totals?: Totals;
};

/** A reply's block as recorded: the text of a `type` call into a secret field left out. */
function withoutSecret(block: unknown, secret: (id: string) => boolean) {
    const b = block as {tool?: string; input?: {id?: unknown; text?: unknown}};
    return b.tool === 'type' && b.input && secret(String(b.input.id)) ? {...b, input: {...b.input, text: '(secret)'}} : block;
}

export function createTranscript(query: string, model: string) {
    const start = performance.now();
    const at = () => Math.round(performance.now() - start);
    const transcript: Transcript = {
        query,
        model,
        path: window.location.pathname + window.location.search,
        startedAt: new Date().toISOString(),
        entries: [],
    };
    const add = (entry: TranscriptEntry) => transcript.entries.push(entry);

    /** the run's totals so far */
    const totals = (): Totals => {
        const requests = transcript.entries.filter((e): e is Extract<TranscriptEntry, {type: 'request'}> => e.type === 'request');
        const usage: Usage = {input: 0, output: 0, cacheRead: 0, cacheWrite: 0};
        for (const r of requests) {
            for (const k of Object.keys(usage) as Array<keyof Usage>) {
                usage[k] += r.usage?.[k] ?? 0;
            }
        }
        return {
            ms: at(),
            modelMs: requests.reduce((sum, r) => sum + r.ms, 0),
            requests: requests.length,
            usage,
            costUsd: requests.reduce((sum, r) => sum + (r.costUsd ?? 0), 0),
        };
    };

    return {
        transcript,
        totals,
        event: (event: AgentEvent) => add({type: 'event', at: at(), event}),
        confirm: (prompt: string, ok: boolean) => add({type: 'confirm', at: at(), prompt, ok}),
        secret: (field: string, entered: boolean) => add({type: 'secret', at: at(), field, entered}),

        /** what the loop logs, a secret field's text left out of a reply's `type` calls */
        claude: (event: string, data: Record<string, unknown>, secret: (id: string) => boolean) => {
            const content = event === 'reply' && Array.isArray(data.content) ? data.content.map((b) => withoutSecret(b, secret)) : undefined;
            add({type: 'claude', at: at(), event, data: content ? {...data, content} : data});
        },
        request: (r: ClaudeRequest) => {
            const usage = usageOf(r);
            add({
                type: 'request',
                at: Math.round(at() - r.ms),
                ms: Math.round(r.ms),
                retries: r.retries,
                ...(usage ? {usage, costUsd: costOf(usage)} : {}),
                ...(r.error ? {error: r.error} : {}),
            });
        },
        result: (result: AgentResult) => {
            transcript.result = result;
            transcript.totals = totals();
        },
    };
}

/** Whether a node is a secret field (its value is never projected): what Claude tried to type into it is never recorded. */
export function secretFields(projector: SemanticProjector) {
    return (id: string) => isSecretField(indexNodes(projector.snapshot().root).get(id)?.node);
}

const ENDPOINT = '/agent-om/transcripts';

let saving: Promise<void> = Promise.resolve();

/** Save it (again: the same run overwrites its file), one save at a time, in order. Never fails the run. */
export function saveTranscript(transcript: Transcript) {
    const body = JSON.stringify(transcript);
    saving = saving.then(async () => {
        try {
            await fetch(ENDPOINT, {method: 'POST', headers: {'Content-Type': 'application/json'}, body});
        } catch {
            // the dev server is gone; the run itself is unaffected
        }
    });
    return saving;
}
