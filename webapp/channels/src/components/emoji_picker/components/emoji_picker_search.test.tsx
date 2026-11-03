// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import EmojiPickerSearch from './emoji_picker_search';

describe('components/emoji_picker/components/EmojiPickerSearch', () => {
    test('should describe how the text it searches with matches', () => {
        renderWithContext(
            <EmojiPickerSearch
                value=''
                cursorCategoryIndex={-1}
                cursorEmojiIndex={-1}
                focus={jest.fn()}
                onEnter={jest.fn()}
                onChange={jest.fn()}
                onKeyDown={jest.fn()}
                resetCursorPosition={jest.fn()}
            />,
        );

        const search = screen.getByRole('textbox', {name: 'Search for an emoji'});
        expect(search).toHaveAccessibleDescription(expect.stringContaining('contains the text you type as one piece, ignoring case'));
        expect(search).toHaveAccessibleDescription(expect.stringContaining('Results update as you type'));
    });
});
