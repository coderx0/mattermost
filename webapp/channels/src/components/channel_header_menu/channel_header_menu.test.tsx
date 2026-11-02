// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {DeepPartial} from '@mattermost/types/utilities';

import {renderWithContext, screen, userEvent, within} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import type {GlobalState} from 'types/store';

import ChannelHeaderMenu from './channel_header_menu';

jest.mock('mattermost-redux/selectors/entities/roles', () => ({
    ...jest.requireActual('mattermost-redux/selectors/entities/roles'),
    haveIChannelPermission: jest.fn(() => true),
}));

jest.mock('utils/popouts/popout_windows', () => ({
    ...jest.requireActual('utils/popouts/popout_windows'),
    canPopout: jest.fn(() => false),
}));

const CHANNEL_ID = 'channel_id';
const TEAM_ID = 'team_id';
const USER_ID = 'user_id';

function getState(channelOverrides: Record<string, unknown> = {}): DeepPartial<GlobalState> {
    const channel = TestHelper.getChannelMock({
        id: CHANNEL_ID,
        team_id: TEAM_ID,
        name: 'project-x',
        display_name: 'Project X',
        type: 'O',
        delete_at: 0,
        ...channelOverrides,
    });
    return {
        entities: {
            channels: {
                currentChannelId: CHANNEL_ID,
                channels: {[CHANNEL_ID]: channel},
                myMembers: {[CHANNEL_ID]: TestHelper.getChannelMembershipMock({channel_id: CHANNEL_ID, user_id: USER_ID})},
            },
            teams: {
                currentTeamId: TEAM_ID,
                teams: {[TEAM_ID]: TestHelper.getTeamMock({id: TEAM_ID, name: 'team'})},
            },
            users: {
                currentUserId: USER_ID,
                profiles: {[USER_ID]: TestHelper.getUserMock({id: USER_ID, roles: 'system_user'})},
            },
            general: {
                license: {},
                config: {},
            },
        },
    };
}

describe('components/channel_header_menu/ChannelHeaderMenu', () => {
    test('should name the menu button by the channel, and describe it by the actions its menu shows', async () => {
        renderWithContext(<ChannelHeaderMenu/>, getState());

        const button = screen.getByRole('button', {name: 'Project X Channel Menu'});
        expect(button).toHaveAttribute('data-agentom-id', 'channel-header.menu');

        const description = button.getAttribute('aria-describedby');
        expect(description).toBeTruthy();
        const descriptionText = document.getElementById(description!)?.textContent;
        expect(descriptionText).toMatch(/^Actions: /);

        await userEvent.click(button);

        // Every item the menu shows, and only those, in its order
        const menu = screen.getByRole('menu');
        const items = within(menu).getAllByRole('menuitem', {hidden: true}).
            filter((item) => !item.closest('[role="menu"] [role="menu"]') && item.getAttribute('aria-disabled') !== 'true').
            map((item) => item.querySelector('.label-elements')?.textContent);
        expect(descriptionText).toBe(`Actions: ${items.join(', ')}`);
    });

    test('should say the channel is archived', () => {
        renderWithContext(<ChannelHeaderMenu/>, getState({delete_at: 1}));

        const button = screen.getByRole('button', {name: 'Project X Channel Menu'});
        expect(button).toHaveAccessibleDescription(/^Archived channel\. Actions: /);
    });

    test('should mark leaving a private channel as destructive and confirmed', async () => {
        renderWithContext(<ChannelHeaderMenu/>, getState({type: 'P'}));

        await userEvent.click(screen.getByRole('button', {name: 'Project X Channel Menu'}));

        const leave = screen.getByRole('menuitem', {name: 'Leave Channel'});
        expect(leave).toHaveAttribute('data-agentom-risk', 'destructive');
        expect(leave).toHaveAttribute('data-agentom-confirmation', 'required');

        const archive = screen.getByRole('menuitem', {name: 'Archive Channel'});
        expect(archive).toHaveAttribute('data-agentom-risk', 'destructive');
        expect(archive).toHaveAttribute('data-agentom-confirmation', 'required');
    });

    test('should mark leaving a public channel as sensitive, without confirmation', async () => {
        renderWithContext(<ChannelHeaderMenu/>, getState());

        await userEvent.click(screen.getByRole('button', {name: 'Project X Channel Menu'}));

        const leave = screen.getByRole('menuitem', {name: 'Leave Channel'});
        expect(leave).toHaveAttribute('data-agentom-risk', 'sensitive');
        expect(leave).not.toHaveAttribute('data-agentom-confirmation');
    });
});
