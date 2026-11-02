// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {filterProfilesMatchingWithTerm} from 'mattermost-redux/utils/user_utils';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import SearchBar from './search';

describe('channel_members_rhs/search', () => {
    test('should describe what the search matches', () => {
        renderWithContext(
            <SearchBar
                terms=''
                onInput={jest.fn()}
            />,
        );

        expect(screen.getByRole('textbox', {name: 'Search members'})).toHaveAccessibleDescription(/^Shows the channel's members, other than deactivated users, whose username, first name, last name, full name, nickname, position or email address before the @ contains the text you type as one piece/);
    });

    // The rule the description states, as the list applies it (index.ts, through searchActiveProfilesInCurrentChannel)
    test('should match the text as one piece, anywhere in a name, ignoring case and a leading @', () => {
        const user = TestHelper.getUserMock({
            username: 'jdoe',
            first_name: 'John',
            last_name: 'Doe',
            nickname: '',
            position: 'Release manager',
            email: 'john.doe@example.com',
        });
        const matches = (term: string) => filterProfilesMatchingWithTerm([user], term).length === 1;

        expect(matches('hn d')).toBe(true);
        expect(matches('@JDO')).toBe(true);
        expect(matches('ease man')).toBe(true);
        expect(matches('doe john')).toBe(false);
        expect(matches('example')).toBe(false);
        expect(matches('doe@example')).toBe(true);
    });
});
