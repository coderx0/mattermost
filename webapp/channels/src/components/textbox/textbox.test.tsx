// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {TextboxClass as Textbox} from 'components/textbox';

import {renderWithContext, screen} from 'tests/react_testing_utils';

describe('components/textbox/Textbox', () => {
    const baseProps = {
        id: 'test-textbox',
        channelId: 'channel1',
        value: '',
        onChange: jest.fn(),
        onKeyPress: jest.fn(),
        createMessage: 'Enter a purpose',
        characterLimit: 100,
        currentUserId: 'user1',
        currentTeamId: 'team1',
        autocompleteGroups: null,
        delayChannelAutocomplete: false,
        useChannelMentions: false,
        supportsCommands: false,
        actions: {
            autocompleteUsersInChannel: jest.fn(),
            autocompleteChannels: jest.fn(),
            searchAssociatedGroupsForReference: jest.fn(),
            fetchAgents: jest.fn(),
        },
    };

    test('should give the text field the label and description it is given', () => {
        renderWithContext(
            <>
                <span id='label'>{'Channel Purpose'}</span>
                <span id='help'>{'Describe how this channel should be used.'}</span>
                <Textbox
                    {...baseProps}
                    aria-labelledby='label'
                    aria-describedby='help'
                    aria-invalid={true}
                />
            </>,
        );

        const field = screen.getByRole('textbox', {name: 'Channel Purpose'});
        expect(field).toHaveAccessibleDescription('Describe how this channel should be used.');
        expect(field).toHaveAttribute('aria-invalid', 'true');
    });
});
