// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-underscore-dangle -- window.__semanticUI is where the Agent Object Model's consumers find the projector */

import {locationWithoutSecrets, screenOf, startProjection} from './projection';

describe('agent_om/projection', () => {
    test('names a screen by what its path holds, never by a team, channel or id', () => {
        const id = 'k7m4ar3s8jbwfxdz9qepohtnyc';
        expect(screenOf('/')).toBe('home');
        expect(screenOf('/login')).toBe('login');
        expect(screenOf(`/admin_console/user_management/users/${id}`)).toBe('admin_console.user_management.users.id');
        expect(screenOf('/acme')).toBe('team');
        expect(screenOf('/acme/channels/town-square')).toBe('team.channel');
        expect(screenOf(`/acme/channels/town-square/${id}`)).toBe('team.channel.post');
        expect(screenOf('/acme/messages/@samuel.tucker')).toBe('team.direct-message');
        expect(screenOf(`/acme/messages/${id}${id.slice(0, 14)}`)).toBe('team.group-message');
        expect(screenOf('/acme/threads')).toBe('team.threads');
        expect(screenOf(`/acme/threads/${id}`)).toBe('team.threads.thread');
        expect(screenOf(`/acme/pl/${id}`)).toBe('team.permalink');
        expect(screenOf('/acme/drafts')).toBe('team.drafts');
        expect(screenOf('/acme/integrations/incoming_webhooks/add')).toBe('team.integrations.incoming_webhooks.add');
    });

    test('leaves the secrets some addresses carry out of the location', () => {
        expect(locationWithoutSecrets('http://x/reset_password_complete?token=s3cret')).toBe('http://x/reset_password_complete');
        expect(locationWithoutSecrets('http://x/signup_user_complete?id=invite&t=s3cret&d=data&extra=1')).toBe('http://x/signup_user_complete?extra=1');
        expect(locationWithoutSecrets('http://x/acme/channels/town-square?id=keep')).toBe('http://x/acme/channels/town-square?id=keep');
    });

    test('reads as loading while a request to the API is under way, and only then', async () => {
        let answer: (r: Response) => void = () => {};
        const api = new Promise<Response>((resolve) => {
            answer = resolve;
        });
        window.fetch = jest.fn((input: RequestInfo | URL) => (String(input).includes('/api/v4/') ? api : Promise.resolve({} as Response)));
        const projector = startProjection();
        expect(window.__semanticUI).toBe(projector);
        expect(projector.snapshot().context.state).toBe('ready');

        await window.fetch('/static/emoji.png');
        expect(projector.snapshot().context.state).toBe('ready');

        const request = window.fetch('/api/v4/users/me');
        expect(projector.snapshot().context.state).toBe('loading');
        answer({} as Response);
        await request;
        expect(projector.snapshot().context.state).toBe('ready');
    });
});
