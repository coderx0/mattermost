// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type JSX} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {WithTooltip} from '@mattermost/shared/components/tooltip';

import ReplyIcon from 'components/widgets/icons/reply_icon';

import type {Locations} from 'utils/constants';

type Props = {
    location?: keyof typeof Locations;
    handleCommentClick?: React.EventHandler<React.MouseEvent>;
    searchStyle?: string;
    commentCount?: number;
    postId?: string;
    extraClass: string;
};

const CommentIcon = ({
    location = 'CENTER',
    searchStyle = '',
    commentCount = 0,
    extraClass = '',
    handleCommentClick,
    postId,
}: Props) => {
    const intl = useIntl();

    let commentCountSpan: JSX.Element | null = null;
    let commentCountDescription: JSX.Element | null = null;
    const commentCountDescriptionId = `${location}_commentIconCount_${postId}`;
    let iconStyle = 'post-menu__item post-menu__item--wide';
    if (commentCount > 0) {
        // The button's name is "reply", so the count it shows is its description.
        commentCountDescription = (
            <span
                id={commentCountDescriptionId}
                hidden={true}
            >
                <FormattedMessage
                    id='threading.numReplies'
                    defaultMessage='{totalReplies, plural, =0 {Reply} =1 {# reply} other {# replies}}'
                    values={{totalReplies: commentCount}}
                />
            </span>
        );
        iconStyle += ' post-menu__item--show';
        commentCountSpan = (
            <span className='post-menu__comment-count'>
                {commentCount}
            </span>
        );
    } else if (searchStyle !== '') {
        iconStyle = `${iconStyle} ${searchStyle}`;
    }

    const replyTitle = intl.formatMessage({
        id: 'post_info.comment_icon.tooltip.reply',
        defaultMessage: 'Reply',
    });

    return (
        <WithTooltip
            title={replyTitle}
        >
            <button
                id={`${location}_commentIcon_${postId}`}
                aria-label={replyTitle.toLowerCase()}
                aria-describedby={commentCountDescription ? commentCountDescriptionId : undefined}
                className={`${iconStyle} ${extraClass}`}
                onClick={handleCommentClick}
            >
                <span className='d-flex align-items-center'>
                    <ReplyIcon className='icon icon--small'/>
                    {commentCountSpan}
                </span>
                {commentCountDescription}
            </button>
        </WithTooltip>
    );
};

export default CommentIcon;
