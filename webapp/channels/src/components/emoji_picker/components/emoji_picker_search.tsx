// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {
    forwardRef,
    memo,
} from 'react';
import type {
    ChangeEvent,
    KeyboardEvent} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {EMOJI_PER_ROW} from 'components/emoji_picker/constants';
import {NavigationDirection} from 'components/emoji_picker/types';

import Constants from 'utils/constants';

interface Props {
    value: string;
    cursorCategoryIndex: number;
    cursorEmojiIndex: number;
    focus: () => void;
    onEnter: () => void;
    onChange: (value: string) => void;
    onKeyDown: (moveTo: NavigationDirection) => void;
    resetCursorPosition: () => void;
}

const KeyCodes = Constants.KeyCodes;

const EmojiPickerSearch = forwardRef<HTMLInputElement, Props>(({value, cursorCategoryIndex, cursorEmojiIndex, onChange, resetCursorPosition, onKeyDown, focus, onEnter}: Props, ref) => {
    const {formatMessage} = useIntl();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();

        // remove trailing and leading colons
        const value = event.target.value.replace(/^:|:$/g, '');
        onChange(value);

        resetCursorPosition();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
        case KeyCodes.RIGHT[0]:
            // If the cursor is at the end of the textbox and an emoji is currently selected, move it to the next emoji
            if ((event.currentTarget?.selectionStart ?? 0) + 1 > value.length || (cursorCategoryIndex !== -1 || cursorEmojiIndex !== -1)) {
                event.stopPropagation();
                event.preventDefault();

                onKeyDown(NavigationDirection.NextEmoji);
            }
            break;
        case KeyCodes.LEFT[0]:
            if (cursorCategoryIndex > 0 || cursorEmojiIndex > 0) {
                event.stopPropagation();
                event.preventDefault();

                onKeyDown(NavigationDirection.PreviousEmoji);
            } else if (cursorCategoryIndex === 0 && cursorEmojiIndex === 0) {
                resetCursorPosition();
                event.currentTarget.selectionStart = value.length;
                event.currentTarget.selectionEnd = value.length;

                event.stopPropagation();
                event.preventDefault();

                focus();
            }
            break;
        case KeyCodes.UP[0]:
            event.stopPropagation();
            event.preventDefault();

            if (event.shiftKey) {
                // If Shift + Ctrl/Cmd + Up is pressed at any time, select/highlight the string to the left of the cursor.
                event.currentTarget.selectionStart = 0;
            } else if (cursorCategoryIndex === -1) {
                // If cursor is on the textbox, set the cursor to the beginning of the string.
                event.currentTarget.selectionStart = 0;
                event.currentTarget.selectionEnd = 0;
            } else if (cursorCategoryIndex === 0 && cursorEmojiIndex < EMOJI_PER_ROW) {
                // If the cursor is highlighting an emoji in the top row,
                // move the cursor back into the text box to the end of the string.
                resetCursorPosition();
                event.currentTarget.selectionStart = value.length;
                event.currentTarget.selectionEnd = value.length;
                focus();
            } else {
                // Otherwise, move the emoji selector up a row.
                onKeyDown(NavigationDirection.PreviousEmojiRow);
            }
            break;
        case KeyCodes.DOWN[0]:
            event.stopPropagation();
            event.preventDefault();

            if (event.shiftKey) {
                // If Shift + Ctrl/Cmd + Down is pressed at any time, select/highlight the string to the right of the cursor.
                event.currentTarget.selectionEnd = value.length;
            } else if (value && event.currentTarget.selectionStart === 0) {
                // If the cursor is at the beginning of the string, move the cursor to the end of the string.
                event.currentTarget.selectionStart = value.length;
                event.currentTarget.selectionEnd = value.length;
            } else {
                // Otherwise, move the selection down in the emoji picker.
                onKeyDown(NavigationDirection.NextEmojiRow);
            }
            break;
        case KeyCodes.ENTER[0]: {
            event.stopPropagation();
            event.preventDefault();

            onEnter();
            break;
        }
        }
    };

    return (
        <div className='emoji-picker__text-container'>
            <span className='icon-magnify icon emoji-picker__search-icon'/>
            <input
                ref={ref}
                id='emojiPickerSearch'
                aria-label={formatMessage({id: 'emoji_picker.search_emoji', defaultMessage: 'Search for an emoji'})}
                aria-describedby='emojiPickerSearchDescription'
                className='emoji-picker__search'
                data-testid='emojiInputSearch'
                type='text'
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                autoComplete='off'
                placeholder={formatMessage({id: 'emoji_picker.search', defaultMessage: 'Search emojis'})}
                value={value}
            />
            {/*
                How the text matches, as the picker does it: handleChange drops a colon at either end; getFilteredEmojis
                (emoji_picker/utils) keeps the emojis one of whose names (a standard emoji's short_names, a custom
                emoji's name) contains the text, lowercased, puts recently used ones first and keeps only the chosen
                skin tone; compareEmojis (utils/emoji_utils) sorts names starting with the text first, then standard
                before custom, then by name; custom emojis are also searched on the server; the first result is
                selected and Enter adds the selected one.
            */}
            <span
                id='emojiPickerSearchDescription'
                hidden={true}
            >
                <FormattedMessage
                    id='emoji_picker.search.description'
                    defaultMessage='Shows the emojis with a name that contains the text you type as one piece, ignoring case and a colon at its start or end: standard emojis by any of their names, custom emojis by their name (also searched on the server). Emojis you used recently come first, then names that start with the text, then standard emojis before custom ones, by name. Emojis with skin tones are shown in the one you chose. Results update as you type; Enter adds the selected emoji, the first one unless you move to another.'
                />
            </span>
        </div>
    );
},
);

EmojiPickerSearch.displayName = 'EmojiPickerSearch';

export default memo(EmojiPickerSearch);
