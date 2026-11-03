// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import SaveChangesPanel from './save_changes_panel';

describe('SaveChangesPanel', () => {
    const defaultProps = {
        handleSubmit: jest.fn(),
        handleCancel: jest.fn(),
        handleClose: jest.fn(),
        state: 'saved' as const,
    };

    test('should show default saved message when no customSavedMessage', () => {
        renderWithContext(<SaveChangesPanel {...defaultProps}/>);
        expect(screen.getByText('Settings saved')).toBeInTheDocument();
    });

    test('should show custom saved message when customSavedMessage is provided', () => {
        renderWithContext(
            <SaveChangesPanel
                {...defaultProps}
                customSavedMessage='Policy saved'
            />,
        );
        expect(screen.getByText('Policy saved')).toBeInTheDocument();
        expect(screen.queryByText('Settings saved')).not.toBeInTheDocument();
    });

    test('should show unsaved changes message in editing state', () => {
        renderWithContext(
            <SaveChangesPanel
                {...defaultProps}
                state='editing'
            />,
        );
        expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });

    test('should show custom error message when provided', () => {
        renderWithContext(
            <SaveChangesPanel
                {...defaultProps}
                state='error'
                customErrorMessage='Failed to save policy'
            />,
        );
        expect(screen.getByText('Failed to save policy')).toBeInTheDocument();
    });

    test('should announce its message as a status, and name its close button', () => {
        renderWithContext(
            <SaveChangesPanel
                {...defaultProps}
                savedSubject='Channel info'
                agentomId='channel-settings.info'
            />,
        );

        // what was saved is named in hidden text; what shows is unchanged
        expect(screen.getByRole('status')).toHaveTextContent('Channel info: Settings saved');
        expect(screen.getByText('Channel info:')).toHaveClass('sr-only');
        expect(screen.getByText('Settings saved')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Close notice'})).toHaveAttribute('data-agentom-id', 'channel-settings.info.close');
    });

    test('should describe the save button with what it keeps, and give the buttons ids and attributes', () => {
        renderWithContext(
            <SaveChangesPanel
                {...defaultProps}
                state='editing'
                saveButtonDescription="Saves the channel's name and header"
                saveButtonAttributes={{'data-agentom-confirmation': 'required'}}
                agentomId='channel-settings.info'
            />,
        );

        const save = screen.getByRole('button', {name: 'Save'});
        expect(save).toHaveAccessibleDescription("Saves the channel's name and header");
        expect(save).toHaveAttribute('data-agentom-id', 'channel-settings.info.save');
        expect(save).toHaveAttribute('data-agentom-confirmation', 'required');
        expect(screen.getByRole('button', {name: 'Undo'})).toHaveAttribute('data-agentom-id', 'channel-settings.info.discard');
        expect(screen.getByRole('status')).toHaveTextContent('You have unsaved changes');
    });

    test('should add nothing when the new props are not given', () => {
        renderWithContext(
            <SaveChangesPanel
                {...defaultProps}
                state='editing'
            />,
        );

        const save = screen.getByRole('button', {name: 'Save'});
        expect(save).not.toHaveAttribute('aria-describedby');
        expect(save).not.toHaveAttribute('data-agentom-id');
    });
});
