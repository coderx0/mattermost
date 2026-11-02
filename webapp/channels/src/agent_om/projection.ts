// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-underscore-dangle -- window.__semanticUI is where the Agent Object Model's consumers find the projector */

import {createSemanticProjector} from '@agent-om/core';
import type {SemanticAppContext, SemanticProjector, SemanticWarning} from '@agent-om/core';

// The app's one projector (the Agent Object Model), on window.__semanticUI where
// any consumer finds it. Its warnings are kept on window.__semanticWarnings.
// agent_om.tsx keeps its context current from the router and the store.

declare global {
    interface Window {
        __semanticUI?: SemanticProjector;
        __semanticWarnings?: SemanticWarning[];
    }
}

export type ChannelKind = 'public' | 'private' | 'direct message' | 'group message';

/** What the projector's context is made of; agent_om.tsx keeps it current. */
export const appContext: {
    screen?: string;

    /** who is signed in, and whether as a system admin (guidelines 5.5) */
    user?: {username: string; role: 'system admin' | 'member'};
    team?: {name: string; displayName: string};
    channel?: {name: string; displayName: string; type?: ChannelKind};

    /** what the right-hand panel shows, when it's open: it has no address of its own */
    panel?: string;
} = {};

/** Requests to the app's API under way: the page is still loading what they bring. */
let requests = 0;

/** The pages at the root of the app, not under a team (components/root/root.tsx). */
const ROOT_PAGES = new Set([
    'error', 'login', 'reset_password', 'reset_password_complete', 'signup_user_complete', 'should_verify_email',
    'do_verify_email', 'claim', 'terms_of_service', 'help', 'landing', 'admin_console', 'select_team', 'oauth',
    'create_team', 'mfa', 'preparing-workspace', '_popout',
]);

/** A Mattermost id (26 lower-case letters and digits), or a group message's (two ids joined). */
const isId = (segment: string) => (/^[a-z0-9]{26}$/).test(segment) || (/^[a-z0-9]{40}$/).test(segment);

/**
 * Screen name from the path: a team's name and ids are named by what they
 * are, never by their value.
 * "/" → "home"; "/admin_console/user_management/users/<id>" → "admin_console.user_management.users.id";
 * "/<team>/channels/<channel>" → "team.channel"; "/<team>/messages/@<user>" → "team.direct-message";
 * "/<team>/threads/<id>" → "team.threads.thread"; "/<team>/pl/<id>" → "team.permalink".
 */
export function screenOf(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean).map((s) => decodeURIComponent(s));
    if (!segments.length) {
        return 'home';
    }
    if (ROOT_PAGES.has(segments[0])) {
        return segments.map((s) => (isId(s) ? 'id' : s)).join('.');
    }
    const [, section, item, post] = segments;
    switch (section) {
    case undefined:
        return 'team';
    case 'channels':
        return post ? 'team.channel.post' : 'team.channel';
    case 'messages':
        return `team.${item?.startsWith('@') ? 'direct-message' : 'group-message'}${post ? '.post' : ''}`;
    case 'threads':
        return item ? 'team.threads.thread' : 'team.threads';
    case 'pl':
        return 'team.permalink';
    default:
        return ['team', ...segments.slice(1).map((s) => (isId(s) ? 'id' : s))].join('.');
    }
}

/**
 * The page's address as the projector sees it, without the secrets some pages
 * carry in it (guidelines 4.5): any token, and an invitation's id, token and
 * data on the sign-up page.
 */
export function locationWithoutSecrets(href = window.location.href) {
    const url = new URL(href);
    url.searchParams.delete('token');
    if (url.pathname.endsWith('/signup_user_complete')) {
        for (const name of ['id', 't', 'd']) {
            url.searchParams.delete(name);
        }
    }
    return url.href;
}

/** Count the app's own API requests under way, so the page reads as loading until they're answered. */
function countRequests(projector: SemanticProjector) {
    const fetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
        let url: string;
        if (typeof input === 'string') {
            url = input;
        } else if (input instanceof URL) {
            url = input.href;
        } else {
            url = input.url;
        }
        if (!new URL(url, window.location.href).pathname.includes('/api/v4/')) {
            return fetch(input, init);
        }
        requests++;
        projector.refresh();
        return fetch(input, init).finally(() => {
            requests--;
            projector.refresh();
        });
    };
}

/** Start the projector once per document. */
export function startProjection(): SemanticProjector {
    if (window.__semanticUI) {
        return window.__semanticUI;
    }
    const warnings: SemanticWarning[] = [];
    window.__semanticWarnings = warnings;
    const projector = createSemanticProjector({
        context: (): SemanticAppContext => ({
            screen: appContext.screen,
            state: requests > 0 ? 'loading' : 'ready',
            ...(appContext.user ? {user: appContext.user} : {}),
            ...(appContext.team ? {team: appContext.team} : {}),
            ...(appContext.channel ? {channel: appContext.channel} : {}),
            ...(appContext.panel ? {panel: appContext.panel} : {}),
        }),
        location: () => locationWithoutSecrets(),
        onWarning: (warning) => {
            warnings.push(warning);
            // eslint-disable-next-line no-console
            console.warn(`[agent-om] ${warning.code}: ${warning.message}`);
        },
    });
    countRequests(projector);
    window.__semanticUI = projector;
    return projector;
}
