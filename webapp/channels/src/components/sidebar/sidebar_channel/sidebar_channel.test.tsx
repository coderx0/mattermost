// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {ChannelType} from '@mattermost/types/channels';

import SidebarChannel from 'components/sidebar/sidebar_channel/sidebar_channel';

import {renderWithContext, screen} from 'tests/react_testing_utils';

jest.mock('components/tours/onboarding_tour', () => ({
    ChannelsAndDirectMessagesTour: () => null,
}));

jest.mock('components/sidebar/sidebar_channel/sidebar_direct_channel', () => () => <div>{'Direct Channel'}</div>);
jest.mock('components/sidebar/sidebar_channel/sidebar_group_channel', () => () => <div>{'Group Channel'}</div>);

describe('components/sidebar/sidebar_channel', () => {
    const baseProps = {
        channel: {
            id: 'channel_id',
            display_name: 'channel_display_name',
            create_at: 0,
            update_at: 0,
            delete_at: 0,
            team_id: '',
            type: 'O' as ChannelType,
            name: '',
            header: '',
            purpose: '',
            last_post_at: 0,
            last_root_post_at: 0,
            creator_id: '',
            scheme_id: '',
            group_constrained: false,
        },
        channelId: 'channel_id',
        isDraggable: false,
        channelIndex: 0,
        currentTeamName: 'team_name',
        unreadMentions: 0,
        isUnread: false,
        setChannelRef: jest.fn(),
        isCategoryCollapsed: false,
        isCurrentChannel: false,
        isAutoSortedCategory: false,
        isCategoryDragged: false,
        isDropDisabled: false,
        draggingState: {},
        multiSelectedChannelIds: [],
        autoSortedCategoryIds: new Set<string>(),
        agentomId: 'channel.channel-name',
        isChannelSelected: false,
    };

    test('should match snapshot', () => {
        const {container} = renderWithContext(
            <SidebarChannel {...baseProps}/>,
        );

        expect(container).toMatchSnapshot();
    });

    // a category's list is a collection of rows (guideline 2.6): each row has its channel's id, its link and options
    // ids under it, and says what hovering over it shows
    test('should give the row its id, and say what hovering over it shows', () => {
        renderWithContext(
            <SidebarChannel {...baseProps}/>,
        );

        const row = screen.getByRole('listitem');
        expect(row).toHaveAttribute('data-agentom-id', 'channel.channel-name');
        expect(row).toHaveAttribute('data-agentom-reveals', 'Channel options');
    });

    test('should match snapshot when collapsed', () => {
        const props = {
            ...baseProps,
            isCategoryCollapsed: true,
        };

        const {container} = renderWithContext(
            <SidebarChannel {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should match snapshot when unread', () => {
        const props = {
            ...baseProps,
            isUnread: true,
            unreadMentions: 1,
        };

        const {container} = renderWithContext(
            <SidebarChannel {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should match snapshot when active', () => {
        const props = {
            ...baseProps,
            isCurrentChannel: true,
        };

        const {container} = renderWithContext(
            <SidebarChannel {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should match snapshot when DM channel', () => {
        const props = {
            ...baseProps,
            channel: {
                ...baseProps.channel,
                type: 'D' as ChannelType,
            },
        };

        const {container} = renderWithContext(
            <SidebarChannel {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should match snapshot when GM channel', () => {
        const props = {
            ...baseProps,
            channel: {
                ...baseProps.channel,
                type: 'G' as ChannelType,
            },
        };

        const {container} = renderWithContext(
            <SidebarChannel {...props}/>,
        );

        expect(container).toMatchSnapshot();
    });

    test('should not be collapsed when there are unread messages', () => {
        const props = {
            ...baseProps,
            isCategoryCollapsed: true,
            isUnread: true,
        };

        renderWithContext(
            <SidebarChannel {...props}/>,
        );

        expect(screen.getByRole('listitem')).toHaveClass('expanded');
    });

    test('should not be collapsed if channel is current channel', () => {
        const props = {
            ...baseProps,
            isCategoryCollapsed: true,
            isCurrentChannel: true,
        };

        renderWithContext(
            <SidebarChannel {...props}/>,
        );

        expect(screen.getByRole('listitem')).toHaveClass('expanded');
    });
});
