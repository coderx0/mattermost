// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';

import {renderWithContext, screen, userEvent} from 'tests/react_testing_utils';

import Toast from './toast';
import type {Props} from './toast';

describe('components/Toast', () => {
    const defaultProps: Props = {
        onClick: jest.fn(),
        show: true,
        showActions: true,
        onClickMessage: (
            <FormattedMessage
                id='postlist.toast.scrollToBottom'
                defaultMessage='Jump to recents'
            />
        ),
        width: 1000,
    };

    test('should match snapshot for showing toast', () => {
        const {container} = renderWithContext(<Toast {...defaultProps}><span>{'child'}</span></Toast>);
        expect(container).toMatchSnapshot();
        expect(screen.getByTestId('dismissToast')).toBeInTheDocument();
    });

    test('should match snapshot for hiding toast', () => {
        const {container} = renderWithContext(<Toast {...{...defaultProps, show: false}}><span>{'child'}</span></Toast>);
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot for toast width less than 780px', () => {
        const {container} = renderWithContext(<Toast {...{...defaultProps, width: 779}}><span>{'child'}</span></Toast>);
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot to not have actions', () => {
        const {container} = renderWithContext(<Toast {...{...defaultProps, showActions: false}}><span>{'child'}</span></Toast>);
        expect(container).toMatchSnapshot();
    });

    test('should dismiss', () => {
        defaultProps.onDismiss = jest.fn();

        renderWithContext(
            <Toast {... defaultProps}>
                <span>{'child'}</span>
            </Toast>,
        );

        screen.getByTestId('dismissToast').click();

        expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
    });

    test('should match snapshot to have extraClasses', () => {
        const {container} = renderWithContext(<Toast {...{...defaultProps, extraClasses: 'extraClasses'}}><span>{'child'}</span></Toast>);
        expect(container).toMatchSnapshot();
    });

    test('should be a status whose jump and close are buttons, adding no tab stops', async () => {
        const onClick = jest.fn();
        const onDismiss = jest.fn();
        renderWithContext(
            <Toast
                {...defaultProps}
                onClick={onClick}
                onDismiss={onDismiss}
            >
                <span>{'3 new messages'}</span>
            </Toast>,
        );

        expect(screen.getByRole('status')).toBeInTheDocument();

        const jump = screen.getByRole('button', {name: 'Jump to recents'});
        expect(jump).toHaveAccessibleDescription('3 new messages');
        expect(jump).not.toHaveAttribute('tabindex');
        await userEvent.click(jump);
        expect(onClick).toHaveBeenCalledTimes(1);

        const close = screen.getByRole('button', {name: 'Close notice'});
        expect(close).not.toHaveAttribute('tabindex');
        await userEvent.click(close);
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });
});
