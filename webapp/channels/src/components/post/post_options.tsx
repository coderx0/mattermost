// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classnames from 'classnames';
import React, {useCallback, useEffect, useId, useRef, useState} from 'react';
import type {JSX, ReactNode} from 'react';
import {FormattedMessage} from 'react-intl';
import type {IntlShape} from 'react-intl';

import type {Emoji} from '@mattermost/types/emojis';
import type {Post} from '@mattermost/types/posts';

import {Posts} from 'mattermost-redux/constants/index';
import {isPostEphemeral} from 'mattermost-redux/utils/post_utils';

import ActionsMenu from 'components/actions_menu';
import CommentIcon from 'components/common/comment_icon';
import DotMenu from 'components/dot_menu';
import PostFlagIcon from 'components/post_view/post_flag_icon';
import PostReaction from 'components/post_view/post_reaction';
import PostRecentReactions from 'components/post_view/post_recent_reactions';

import PluggableErrorBoundary from 'plugins/pluggable/error_boundary';
import {getPostAgentomId} from 'utils/agentom_ids';
import {Locations, Constants} from 'utils/constants';
import {isSystemMessage, fromAutoResponder} from 'utils/post_utils';

import type {PostActionComponent} from 'types/store/plugins';

type Props = {
    post: Post;
    teamId: string;
    isFlagged: boolean;
    removePost: (post: Post) => void;
    enableEmojiPicker?: boolean;
    isReadOnly?: boolean;
    channelIsArchived?: boolean;
    handleCommentClick?: (e: React.MouseEvent) => void;
    handleJumpClick?: (e: React.MouseEvent) => void;
    handleDropdownOpened?: (e: boolean) => void;
    collapsedThreadsEnabled?: boolean;
    shouldShowActionsMenu?: boolean;
    oneClickReactionsEnabled?: boolean;
    recentEmojis: Emoji[];
    isExpanded?: boolean;
    hover?: boolean;
    isMobileView: boolean;
    hasReplies?: boolean;
    isFirstReply?: boolean;
    canReply?: boolean;
    replyCount?: number;
    location: keyof typeof Locations;
    isLastPost?: boolean;
    shortcutReactToLastPostEmittedFrom?: string;
    isPostHeaderVisible?: boolean | null;
    isPostBeingEdited?: boolean;
    canDelete?: boolean;
    pluginActions: PostActionComponent[];
    isChannelAutotranslated: boolean;
    isBurnOnReadPost?: boolean;
    shouldDisplayBurnOnReadConcealed?: boolean;
    actions: {
        emitShortcutReactToLastPostFrom: (emittedFrom: 'CENTER' | 'RHS_ROOT' | 'NO_WHERE') => void;
    };
};

type ShownProps = Pick<Props, 'post' | 'location' | 'isMobileView' | 'hasReplies' | 'isFirstReply' | 'isReadOnly' | 'enableEmojiPicker' | 'channelIsArchived' | 'shouldDisplayBurnOnReadConcealed' | 'isBurnOnReadPost'>;

/**
 * Which of a post's options are rendered, given whether it's hovered (or active, or one of its menus is open): one
 * source for the options below and for what the post says its hover shows (getPostHoverReveals).
 */
function postOptionsShown(props: ShownProps, hoverLocal: boolean) {
    const {post} = props;
    const isEphemeral = isPostEphemeral(post);
    const systemMessage = isSystemMessage(post);
    const isFromAutoResponder = fromAutoResponder(post);
    const isBurnOnReadPost = props.isBurnOnReadPost || false;
    return {
        comment: !isBurnOnReadPost && (isFromAutoResponder || (!systemMessage && (props.isMobileView ||
            hoverLocal || (!post.root_id && Boolean(props.hasReplies)) ||
            props.isFirstReply) && props.location === Locations.CENTER)),

        // Don't show emoji picker button for unrevealed BoR posts
        reaction: !systemMessage && !props.isReadOnly && !isEphemeral && !post.failed && props.enableEmojiPicker && !props.channelIsArchived && !props.shouldDisplayBurnOnReadConcealed,

        // Don't show save button for unrevealed BoR posts
        flag: !props.isMobileView && (!isEphemeral && !post.failed && !systemMessage) && !props.shouldDisplayBurnOnReadConcealed,
    };
}

/**
 * The names of a post's options that are shown only while the pointer is over it (wider screens, where the post
 * menu's items are hidden until then), comma-separated for data-agentom-reveals; undefined when there are none.
 * Each name is its button's own accessible name. Recent reactions are left out: they're shortcuts for Add Reaction.
 */
export function getPostHoverReveals(props: ShownProps & Pick<Props, 'isFlagged' | 'collapsedThreadsEnabled' | 'replyCount' | 'isPostBeingEdited' | 'canDelete'>, intl: Pick<IntlShape, 'formatMessage'>): string | undefined {
    const {post} = props;
    const systemMessage = isSystemMessage(post);
    if (props.isMobileView || props.location === Locations.SEARCH || props.isPostBeingEdited || isPostEphemeral(post) ||
        post.state === Posts.POST_DELETED || (systemMessage && !props.canDelete)) {
        return undefined;
    }
    const shown = postOptionsShown(props, true);
    const names: string[] = [];
    if (shown.reaction) {
        names.push(intl.formatMessage({id: 'post_info.tooltip.add_reactions', defaultMessage: 'Add Reaction'}));
    }
    if (shown.flag) {
        names.push((props.isFlagged ? intl.formatMessage({id: 'flag_post.unflag', defaultMessage: 'Remove from Saved'}) : intl.formatMessage({id: 'flag_post.flag', defaultMessage: 'Save Message'})).toLowerCase());
    }

    // A reply button showing a count is shown without hover too
    const commentCount = props.collapsedThreadsEnabled ? 0 : (props.replyCount ?? 0);
    if (shown.comment && commentCount === 0) {
        names.push(intl.formatMessage({id: 'post_info.comment_icon.tooltip.reply', defaultMessage: 'Reply'}).toLowerCase());
    }
    names.push(intl.formatMessage({id: 'post_info.dot_menu.tooltip.more', defaultMessage: 'More'}).toLowerCase());
    return names.join(', ');
}

const PostOptions = (props: Props): JSX.Element => {
    const jumpDescriptionId = useId();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showDotMenu, setShowDotMenu] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [showPluginMenu, setShowPluginMenu] = useState(false);

    const toggleEmojiPicker = useCallback((show: boolean) => {
        setShowEmojiPicker(show);
        props.handleDropdownOpened!(show);
    }, [props.handleDropdownOpened]);

    const lastEmittedFrom = useRef(props.shortcutReactToLastPostEmittedFrom);
    useEffect(() => {
        // Confirm that lastEmittedFrom actually changed to avoid toggling the emoji picker when another dependency
        // changes without the user pressing the hotkey again
        if (lastEmittedFrom.current === props.shortcutReactToLastPostEmittedFrom) {
            return;
        }

        lastEmittedFrom.current = props.shortcutReactToLastPostEmittedFrom;

        const locationToUse = props.location === 'RHS_COMMENT' ? Locations.RHS_ROOT : props.location;

        if (props.isLastPost &&
            (props.shortcutReactToLastPostEmittedFrom === locationToUse) &&
                props.isPostHeaderVisible) {
            props.actions.emitShortcutReactToLastPostFrom(Locations.NO_WHERE);
            toggleEmojiPicker(!showEmojiPicker);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.isLastPost, props.shortcutReactToLastPostEmittedFrom, props.location, props.isPostHeaderVisible, showEmojiPicker]);

    const {
        channelIsArchived,
        collapsedThreadsEnabled,
        isReadOnly,
        post,
        oneClickReactionsEnabled,
        isMobileView,
    } = props;

    const isEphemeral = isPostEphemeral(post);
    const systemMessage = isSystemMessage(post);

    function removePost() {
        props.removePost(props.post);
    }

    const handleDotMenuOpened = (open: boolean) => {
        setShowDotMenu(open);
        props.handleDropdownOpened!(open);
    };

    const handleActionsMenuOpened = (open: boolean) => {
        setShowActionsMenu(open);
        props.handleDropdownOpened!(open);
    };

    const handlePluginMenuOpened = (open: boolean) => {
        setShowPluginMenu(open);
        props.handleDropdownOpened!(open);
    };

    const isPostDeleted = post && post.state === Posts.POST_DELETED;
    const hoverLocal = props.hover || showEmojiPicker || showDotMenu || showActionsMenu || showPluginMenu;
    const isBurnOnReadPost = props.isBurnOnReadPost || false;
    const shown = postOptionsShown(props, hoverLocal);
    const showCommentIcon = shown.comment;
    const commentIconExtraClass = isMobileView ? '' : 'pull-right';

    let commentIcon;
    if (showCommentIcon) {
        commentIcon = (
            <li>
                <CommentIcon
                    handleCommentClick={props.handleCommentClick}
                    postId={post.id}
                    extraClass={commentIconExtraClass}
                    commentCount={props.collapsedThreadsEnabled ? 0 : props.replyCount}
                />
            </li>
        );
    }

    // Don't show reactions for unrevealed BoR posts - users can't react to concealed content
    const showRecentlyUsedReactions = (!isMobileView && !isReadOnly && !isEphemeral && !post.failed && !systemMessage && !channelIsArchived && oneClickReactionsEnabled && props.enableEmojiPicker && hoverLocal && !props.shouldDisplayBurnOnReadConcealed);

    let showRecentReactions: ReactNode;
    if (showRecentlyUsedReactions) {
        const showMoreReactions = props.isExpanded ||
            props.location === 'CENTER' ||
            (document.getElementById('sidebar-right')?.getBoundingClientRect().width ?? 0) > Constants.SIDEBAR_MINIMUM_WIDTH;

        showRecentReactions = (
            <PostRecentReactions
                channelId={post.channel_id}
                postId={post.id}
                teamId={props.teamId}
                emojis={props.recentEmojis}
                size={showMoreReactions ? 3 : 1}
            />
        );
    }

    const showReactionIcon = shown.reaction;
    let postReaction;
    if (showReactionIcon) {
        postReaction = (
            <li>
                <PostReaction
                    channelId={post.channel_id}
                    location={props.location}
                    postId={post.id}
                    teamId={props.teamId}
                    showEmojiPicker={showEmojiPicker}
                    setShowEmojiPicker={toggleEmojiPicker}
                />
            </li>
        );
    }

    let flagIcon: ReactNode = null;
    if (shown.flag) {
        flagIcon = (
            <li>
                <PostFlagIcon
                    location={props.location}
                    postId={post.id}
                    isFlagged={props.isFlagged}
                />
            </li>
        );
    }

    // Action menus
    const showActionsMenuIcon = props.shouldShowActionsMenu && (isMobileView || hoverLocal);
    const actionsMenu = showActionsMenuIcon && (
        <li>
            <ActionsMenu
                post={post}
                location={props.location}
                handleDropdownOpened={handleActionsMenuOpened}
                isMenuOpen={showActionsMenu}
            />
        </li>
    );

    let pluginItems: ReactNode = null;

    if ((!isEphemeral && !post.failed && !systemMessage && !isBurnOnReadPost) && hoverLocal) {
        pluginItems = props.pluginActions?.
            map((item) => {
                if (item.component) {
                    const Component = item.component;
                    return (
                        <li key={item.id}>
                            <PluggableErrorBoundary pluginId={item.pluginId}>
                                <Component
                                    post={props.post}
                                    handleDropdownOpened={handlePluginMenuOpened}
                                />
                            </PluggableErrorBoundary>
                        </li>
                    );
                }
                return null;
            }) || [];
    }

    const dotMenu = (

        // Use a key to keep the DotMenu mounted even if it changes position below
        <li key='dotMenu'>
            <DotMenu
                post={props.post}
                location={props.location}
                isFlagged={props.isFlagged}
                handleDropdownOpened={handleDotMenuOpened}
                handleCommentClick={props.handleCommentClick}
                handleAddReactionClick={toggleEmojiPicker}
                isReadOnly={isReadOnly || channelIsArchived}
                isMenuOpen={showDotMenu}
                enableEmojiPicker={props.enableEmojiPicker}
                isChannelAutotranslated={props.isChannelAutotranslated}
            />
        </li>
    );

    // Build post options
    let options: ReactNode;
    if (isEphemeral) {
        options = (
            <div className='col col__remove'>
                <button
                    className='post__remove theme color--link style--none'
                    data-testid='post-remove-button'
                    onClick={removePost}
                >
                    {'×'}
                </button>
            </div>
        );
    } else if (isPostDeleted || (systemMessage && !props.canDelete)) {
        options = null;
    } else if (props.location === Locations.SEARCH) {
        const hasCRTFooter = props.collapsedThreadsEnabled && !post.root_id && (post.reply_count > 0 || post.is_following);
        options = (
            <ul
                className='col__controls post-menu'
                data-testid={`post-menu-${props.post.id}`}
            >
                {dotMenu}
                {flagIcon}
                {props.canReply && !hasCRTFooter &&
                <li>
                    <CommentIcon
                        location={props.location}
                        handleCommentClick={props.handleCommentClick}
                        commentCount={props.replyCount}
                        postId={post.id}
                        searchStyle={'search-item__comment'}
                        extraClass={props.replyCount ? 'icon--visible' : ''}
                    />
                </li>
                }
                <li>
                    {/* An anchor without an address that opens the message in its channel on click: it says it's a
                        button, described by what it does (the keyboard reaches it as before) */}
                    <a
                        href='#'
                        onClick={props.handleJumpClick}
                        className='search-item__jump'
                        role='button'
                        aria-describedby={jumpDescriptionId}
                        data-agentom-id={`${getPostAgentomId(props.location, post.id)}.jump`}
                    >
                        <FormattedMessage
                            id='search_item.jump'
                            defaultMessage='Jump'
                        />
                    </a>
                    <span
                        id={jumpDescriptionId}
                        hidden={true}
                    >
                        <FormattedMessage
                            id='search_item.jump.description'
                            defaultMessage='Opens the message in its channel'
                        />
                    </span>
                </li>
            </ul>
        );
    } else if (!props.isPostBeingEdited) {
        options = (
            <ul
                data-testid={`post-menu-${props.post.id}`}
                className={classnames('col post-menu', {'post-menu--position': !hoverLocal && showCommentIcon})}
            >
                {!collapsedThreadsEnabled && !showRecentlyUsedReactions && dotMenu}
                {showRecentReactions}
                {postReaction}
                {flagIcon}
                {pluginItems}
                {actionsMenu}
                {commentIcon}
                {(collapsedThreadsEnabled || showRecentlyUsedReactions) && dotMenu}
            </ul>
        );
    }

    return <>{options}</>;
};

export default PostOptions;
