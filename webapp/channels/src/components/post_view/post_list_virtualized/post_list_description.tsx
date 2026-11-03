// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useMemo} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';

import {getDateForDateLine, isDateLine, isStartOfNewMessages} from 'mattermost-redux/utils/post_list';

export const POST_LIST_DESCRIPTION_ID = 'postListDescription';

const messages = defineMessages({
    shown: {
        id: 'post_list.description.shown',
        defaultMessage: '{count, plural, one {# message} other {# messages}} shown, from {oldest} to {newest}, oldest first.',
    },
    shownOneDay: {
        id: 'post_list.description.shown_one_day',
        defaultMessage: '{count, plural, one {# message} other {# messages}} shown, all from {day}, oldest first.',
    },
    noneShown: {
        id: 'post_list.description.none_shown',
        defaultMessage: 'No messages shown.',
    },
    beginning: {
        id: 'post_list.description.beginning',
        defaultMessage: 'The beginning of the channel is shown.',
    },
    older: {
        id: 'post_list.description.older',
        defaultMessage: 'Older messages load as you scroll up.',
    },
    newer: {
        id: 'post_list.description.newer',
        defaultMessage: 'Newer messages load as you scroll down.',
    },
    loadingOlder: {
        id: 'post_list.status.loading_older',
        defaultMessage: 'Loading older messages…',
    },
    loadingNewer: {
        id: 'post_list.status.loading_newer',
        defaultMessage: 'Loading newer messages…',
    },
});

type Props = {

    /*
     * The list's rows, newest first: posts, combined system messages, date lines and the new messages line
     */
    postListIds?: string[];
    atOldestPost?: boolean;
    atLatestPost?: boolean;
    loadingOlderPosts: boolean;
    loadingNewerPosts: boolean;
};

/**
 * What part of the channel the message list holds, for the list's description: the list shows only the messages
 * loaded so far and loads more as it's scrolled, so how many are shown, from which day to which, and whether the
 * channel's start and its latest messages are among them, exist only if the page says them. A status line says
 * while older or newer messages are loading.
 */
const PostListDescription = ({postListIds = [], atOldestPost, atLatestPost, loadingOlderPosts, loadingNewerPosts}: Props) => {
    const {formatMessage, formatDate} = useIntl();
    const {count, oldestDay, newestDay} = useMemo(() => {
        const dateLines = postListIds.filter(isDateLine);
        return {

            // Every row other than a date line or the new messages line is a message (a run of joins and leaves
            // is one row)
            count: postListIds.filter((id) => !isDateLine(id) && !isStartOfNewMessages(id)).length,

            // The rows are newest first, and a day's date line comes after its messages
            newestDay: dateLines.length ? getDateForDateLine(dateLines[0]) : undefined,
            oldestDay: dateLines.length ? getDateForDateLine(dateLines[dateLines.length - 1]) : undefined,
        };
    }, [postListIds]);

    // A date line's time is set so that its day in the browser's time zone is the day in the user's (see
    // mattermost-redux utils/post_list), so it's formatted without a time zone
    const formatDay = (day: number) => formatDate(day, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});

    const sentences = [];
    if (count === 0 || oldestDay === undefined || newestDay === undefined) {
        sentences.push(formatMessage(messages.noneShown));
    } else if (oldestDay === newestDay) {
        sentences.push(formatMessage(messages.shownOneDay, {count, day: formatDay(oldestDay)}));
    } else {
        sentences.push(formatMessage(messages.shown, {count, oldest: formatDay(oldestDay), newest: formatDay(newestDay)}));
    }
    sentences.push(formatMessage(atOldestPost ? messages.beginning : messages.older));
    if (!atLatestPost) {
        sentences.push(formatMessage(messages.newer));
    }
    const description = sentences.join(' ');

    let status = null;
    if (loadingOlderPosts) {
        status = <FormattedMessage {...messages.loadingOlder}/>;
    } else if (loadingNewerPosts) {
        status = <FormattedMessage {...messages.loadingNewer}/>;
    }

    return (
        <>
            <span
                id={POST_LIST_DESCRIPTION_ID}
                hidden={true}
            >
                {description}
            </span>
            <span
                className='sr-only'
                role='status'
            >
                {status}
            </span>
        </>
    );
};

export default PostListDescription;
