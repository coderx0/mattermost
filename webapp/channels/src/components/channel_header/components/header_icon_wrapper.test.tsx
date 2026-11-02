// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import HeaderIconWrapper from 'components/channel_header/components/header_icon_wrapper';
import MentionsIcon from 'components/widgets/icons/mentions_icon';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';

describe('components/channel_header/components/HeaderIconWrapper', () => {
    const mentionsIcon = (
        <MentionsIcon
            className='icon icon__mentions'
            aria-hidden='true'
        />
    );

    const baseProps = {
        children: mentionsIcon,
        buttonClass: 'button_class',
        buttonId: 'button_id',
        onClick: jest.fn(),
        tooltip: 'Recent mentions',
    };

    test('should be accessible', async () => {
        renderWithContext(
            <HeaderIconWrapper
                {...baseProps}
            />,
        );

        expect(screen.getByLabelText('Recent mentions')).toBeVisible();
        expect(screen.queryByText('Recent mentions')).not.toBeInTheDocument();

        await userEvent.hover(screen.getByLabelText('Recent mentions'));

        await waitFor(() => {
            expect(screen.queryByText('Recent mentions')).toBeInTheDocument();
        });
    });

    test('should show the shortcut in its tooltip', async () => {
        renderWithContext(
            <HeaderIconWrapper
                {...baseProps}
                tooltipShortcut={{default: ['a', 'b', 'c']}}
            />,
        );

        expect(screen.getByLabelText('Recent mentions')).toBeVisible();
        expect(screen.queryByText('Recent mentions')).not.toBeInTheDocument();
        expect(screen.queryByText('a')).not.toBeInTheDocument();
        expect(screen.queryByText('b')).not.toBeInTheDocument();
        expect(screen.queryByText('c')).not.toBeInTheDocument();

        await userEvent.hover(screen.getByLabelText('Recent mentions'));

        await waitFor(() => {
            expect(screen.queryByText('Recent mentions')).toBeInTheDocument();

            expect(screen.queryByText('a')).toBeVisible();
            expect(screen.queryByText('b')).toBeVisible();
            expect(screen.queryByText('c')).toBeVisible();
        });
    });
    test('should say whether the panel it opens is shown, and what it shows', () => {
        renderWithContext(
            <>
                <HeaderIconWrapper
                    {...baseProps}
                    tooltip='Members'
                    ariaExpanded={true}
                    ariaControls='sidebar-right'
                    ariaDescribedBy='count'
                    agentomId='channel-header.members'
                />
                <span id='count'>{'4 members'}</span>
            </>,
        );

        const button = screen.getByRole('button', {name: 'Members'});
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(button).toHaveAttribute('aria-controls', 'sidebar-right');
        expect(button).toHaveAttribute('data-agentom-id', 'channel-header.members');
        expect(button).toHaveAccessibleDescription('4 members');
    });

    test('should add none of them when they are not given', () => {
        renderWithContext(
            <HeaderIconWrapper
                {...baseProps}
            />,
        );

        const button = screen.getByRole('button', {name: 'Recent mentions'});
        expect(button).not.toHaveAttribute('aria-expanded');
        expect(button).not.toHaveAttribute('aria-controls');
        expect(button).not.toHaveAttribute('data-agentom-id');
    });
});
