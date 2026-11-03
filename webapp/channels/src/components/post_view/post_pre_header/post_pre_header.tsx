// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useId} from 'react';
import {FormattedMessage, defineMessages, injectIntl} from 'react-intl';
import type {IntlShape, MessageDescriptor} from 'react-intl';

import FlagIconFilled from 'components/widgets/icons/flag_icon_filled';

export type Props = {
    intl: IntlShape;
    isFlagged: boolean;
    isPinned?: boolean;
    skipPinned?: boolean;
    skipFlagged?: boolean;
    channelId: string;
    actions: {
        showFlaggedPosts: () => void;
        showPinnedPosts: (channelId: string) => void;
    };
};

export enum PostPinnedOrFlagged {
    Flagged,
    Pinned,
    PinnedAndFlagged,
    Neither,
}

enum MessageInfoKey {
    Flagged = 'flagged',
    Pinned = 'pinned',
    PinnedAndFlagged = 'pinnedAndFlagged',
}

class PostPreHeader extends React.PureComponent<Props> {
    getPostStatus(isFlagged: boolean, isPinned?: boolean): PostPinnedOrFlagged {
        if (isFlagged) {
            if (isPinned) {
                return PostPinnedOrFlagged.PinnedAndFlagged;
            }

            return PostPinnedOrFlagged.Flagged;
        }

        if (isPinned) {
            return PostPinnedOrFlagged.Pinned;
        }

        return PostPinnedOrFlagged.Neither;
    }

    getMessageInfo(postStatus: PostPinnedOrFlagged, skipFlagged?: boolean, skipPinned?: boolean): MessageInfoKey | false {
        if (skipFlagged && skipPinned) {
            return false;
        }

        if (postStatus === PostPinnedOrFlagged.PinnedAndFlagged) {
            if (!skipPinned && !skipFlagged) {
                return MessageInfoKey.PinnedAndFlagged;
            }

            if (skipPinned) {
                return MessageInfoKey.Flagged;
            }

            if (skipFlagged) {
                return MessageInfoKey.Pinned;
            }
        }

        if (postStatus === PostPinnedOrFlagged.Flagged && !skipFlagged) {
            return MessageInfoKey.Flagged;
        }

        if (postStatus === PostPinnedOrFlagged.Pinned && !skipPinned) {
            return MessageInfoKey.Pinned;
        }

        return false;
    }

    handleLinkClick = (messageKey: MessageInfoKey, channelId?: string) => {
        if (messageKey === MessageInfoKey.Pinned && channelId) {
            this.props.actions.showPinnedPosts(channelId);
        } else {
            this.props.actions.showFlaggedPosts();
        }
    };

    render() {
        const {isFlagged, isPinned, skipPinned, skipFlagged, channelId} = this.props;

        const messageKey = this.getMessageInfo(this.getPostStatus(isFlagged, isPinned), skipFlagged, skipPinned);

        if ((!isFlagged && !isPinned) || !messageKey) {
            return null;
        }

        return (
            <div className='post-pre-header'>
                <div className='post-pre-header__icons-container'>
                    {isPinned && !skipPinned && <span className='icon-pin icon icon--post-pre-header'/>}
                    {isFlagged && !skipFlagged && <FlagIconFilled className='icon icon--post-pre-header'/>}
                </div>
                <div className='post-pre-header__text-container'>
                    {messageKey &&
                    messageKey !== MessageInfoKey.PinnedAndFlagged && (
                        <span>
                            <PreHeaderLink
                                label={messages[messageKey]}
                                description={messageKey === MessageInfoKey.Pinned ? messages.pinnedDescription : messages.flaggedDescription}
                                onActivate={() => this.handleLinkClick(messageKey, channelId)}
                            />
                        </span>
                    )}
                    {messageKey &&
                    messageKey === MessageInfoKey.PinnedAndFlagged && (
                        <span>
                            <PreHeaderLink
                                label={messages[MessageInfoKey.Pinned]}
                                description={messages.pinnedDescription}
                                onActivate={() => this.handleLinkClick(MessageInfoKey.Pinned, channelId)}
                            />
                            <span
                                className='post-pre-header__link-separator'
                                aria-hidden='true'
                            >
                                {'\u2B24'}
                            </span>
                            <PreHeaderLink
                                label={messages[MessageInfoKey.Flagged]}
                                description={messages.flaggedDescription}
                                onActivate={() => this.handleLinkClick(MessageInfoKey.Flagged)}
                            />
                        </span>
                    )}
                </div>
            </div>
        );
    }
}

const messages = defineMessages({
    [MessageInfoKey.Flagged]: {
        id: 'post_pre_header.flagged',
        defaultMessage: 'Saved',
    },
    [MessageInfoKey.Pinned]: {
        id: 'post_pre_header.pinned',
        defaultMessage: 'Pinned',
    },
    pinnedDescription: {
        id: 'post_pre_header.pinned.description',
        defaultMessage: "Shows the channel's pinned messages",
    },
    flaggedDescription: {
        id: 'post_pre_header.flagged.description',
        defaultMessage: 'Shows your saved messages',
    },
});

type PreHeaderLinkProps = {
    label: MessageDescriptor;
    description: MessageDescriptor;
    onActivate: () => void;
};

// "Pinned" and "Saved" say what the post is and open the list it's in. They're anchors without an address that
// act on click, so they say they're buttons, described by the list they show (the keyboard reaches them as before).
function PreHeaderLink({label, description, onActivate}: PreHeaderLinkProps) {
    const descriptionId = useId();

    return (
        <>
            <a
                role='button'
                aria-describedby={descriptionId}
                onClick={onActivate}
            >
                <FormattedMessage {...label}/>
            </a>
            <span
                id={descriptionId}
                hidden={true}
            >
                <FormattedMessage {...description}/>
            </span>
        </>
    );
}

export default injectIntl(PostPreHeader);
