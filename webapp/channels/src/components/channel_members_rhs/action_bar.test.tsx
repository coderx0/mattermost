// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';
import Constants from 'utils/constants';

import ActionBar from './action_bar';
import type {Props} from './action_bar';

describe('channel_members_rhs/action_bar', () => {
    const actionBarDefaultProps: Props = {
        channelType: Constants.OPEN_CHANNEL,
        membersCount: 12,
        canManageMembers: true,
        editing: false,
        actions: {
            startEditing: jest.fn(),
            stopEditing: jest.fn(),
            inviteMembers: jest.fn(),
        },
    };

    beforeEach(() => {
        actionBarDefaultProps.actions = {
            startEditing: jest.fn(),
            stopEditing: jest.fn(),
            inviteMembers: jest.fn(),
        };
    });

    test('should display the members count', () => {
        const testProps: Props = {...actionBarDefaultProps};

        renderWithContext(
            <ActionBar
                {...testProps}
            />,
        );

        expect(screen.getByText(`${testProps.membersCount} members`)).toBeInTheDocument();
    });

    test('should display Add button', async () => {
        const testProps: Props = {...actionBarDefaultProps};

        renderWithContext(
            <ActionBar
                {...testProps}
            />,
        );

        expect(screen.getByText('Add')).toBeInTheDocument();
        await userEvent.click(screen.getByText('Add'));
        expect(testProps.actions.inviteMembers).toHaveBeenCalled();
    });

    test('should not display Add button to members', () => {
        const testProps: Props = {...actionBarDefaultProps, canManageMembers: false};

        renderWithContext(
            <ActionBar
                {...testProps}
            />,
        );

        expect(screen.queryByText('Add')).not.toBeInTheDocument();
    });

    test('should display Manage', async () => {
        const testProps: Props = {...actionBarDefaultProps};

        renderWithContext(
            <ActionBar
                {...testProps}
            />,
        );

        expect(screen.getByText('Manage')).toBeInTheDocument();
        await userEvent.click(screen.getByText('Manage'));
        expect(testProps.actions.startEditing).toHaveBeenCalled();
    });

    test('should display Done', async () => {
        const testProps: Props = {
            ...actionBarDefaultProps,
            editing: true,
        };

        renderWithContext(
            <ActionBar
                {...testProps}
            />,
        );

        expect(screen.getByText('Done')).toBeInTheDocument();
        await userEvent.click(screen.getByText('Done'));
        expect(testProps.actions.stopEditing).toHaveBeenCalled();
    });

    test('should not display manage button to members', () => {
        const testProps: Props = {...actionBarDefaultProps, canManageMembers: false};

        renderWithContext(
            <ActionBar
                {...testProps}
            />,
        );

        expect(screen.queryByText('Manage')).not.toBeInTheDocument();
    });
    test('should name the Add button by what it adds, and describe the Manage button with a pinned id', async () => {
        const testProps: Props = {...actionBarDefaultProps};
        const {rerender} = renderWithContext(
            <ActionBar
                {...testProps}
            />,
        );

        expect(screen.getByRole('button', {name: 'Add members'})).toBeInTheDocument();
        const manage = screen.getByRole('button', {name: 'Manage'});
        expect(manage).toHaveAttribute('data-agentom-id', 'channel-members.manage');
        expect(manage).toHaveAccessibleDescription('Shows a role menu beside each member, to change their role or remove them from the channel');

        rerender(
            <ActionBar
                {...testProps}
                editing={true}
            />,
        );

        const done = screen.getByRole('button', {name: 'Done'});
        expect(done).toHaveAttribute('data-agentom-id', 'channel-members.manage');
        expect(done).toHaveAccessibleDescription("Stops managing members: hides each member's role menu");
    });
});
