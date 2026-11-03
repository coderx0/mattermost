// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {DATE_LINE, START_OF_NEW_MESSAGES} from 'mattermost-redux/utils/post_list';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import PostListDescription, {POST_LIST_DESCRIPTION_ID} from './post_list_description';

describe('components/post_view/post_list_virtualized/PostListDescription', () => {
    // Rows newest first, as the list gets them: each day's date line comes after its messages
    const nov3 = new Date(2026, 10, 3, 9, 0).getTime();
    const nov1 = new Date(2026, 10, 1, 9, 0).getTime();
    const postListIds = [
        'post3',
        `${START_OF_NEW_MESSAGES}${nov3}`,
        'post2',
        `${DATE_LINE}${nov3}`,
        'user-activity-post0_post1',
        'post1',
        `${DATE_LINE}${nov1}`,
    ];

    const baseProps = {
        postListIds,
        atOldestPost: false,
        atLatestPost: true,
        loadingOlderPosts: false,
        loadingNewerPosts: false,
    };

    function description(container: HTMLElement) {
        return container.querySelector(`#${POST_LIST_DESCRIPTION_ID}`)?.textContent;
    }

    test('should say how many messages are shown, from which day to which, and that older ones load on scroll', () => {
        const {container} = renderWithContext(<PostListDescription {...baseProps}/>);

        expect(description(container)).toBe(
            '4 messages shown, from Sunday, November 1, 2026 to Tuesday, November 3, 2026, oldest first. ' +
            'Older messages load as you scroll up.',
        );
        expect(screen.getByRole('status')).toHaveTextContent('');
    });

    test('should say when the channel\'s beginning is shown and newer messages aren\'t', () => {
        const {container} = renderWithContext(
            <PostListDescription
                {...baseProps}
                postListIds={['post1', `${DATE_LINE}${nov1}`]}
                atOldestPost={true}
                atLatestPost={false}
            />,
        );

        expect(description(container)).toBe(
            '1 message shown, all from Sunday, November 1, 2026, oldest first. ' +
            'The beginning of the channel is shown. Newer messages load as you scroll down.',
        );
    });

    test('should say while older or newer messages load', () => {
        const {rerender} = renderWithContext(
            <PostListDescription
                {...baseProps}
                loadingOlderPosts={true}
            />,
        );
        expect(screen.getByRole('status')).toHaveTextContent('Loading older messages…');

        rerender(
            <PostListDescription
                {...baseProps}
                loadingNewerPosts={true}
            />,
        );
        expect(screen.getByRole('status')).toHaveTextContent('Loading newer messages…');
    });
});
