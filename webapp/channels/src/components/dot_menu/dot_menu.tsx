// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {type JSX} from 'react';
import {FormattedMessage, defineMessages, injectIntl} from 'react-intl';
import type {IntlShape, MessageDescriptor} from 'react-intl';

import {
    AlertOutlineIcon,
    ArrowRightBoldOutlineIcon,
    BookmarkIcon,
    BookmarkOutlineIcon,
    ContentCopyIcon,
    DotsHorizontalIcon,
    EmoticonPlusOutlineIcon,
    LinkVariantIcon,
    MarkAsUnreadIcon,
    MessageArrowRightOutlineIcon,
    MessageCheckOutlineIcon,
    MessageMinusOutlineIcon,
    PencilOutlineIcon,
    PinIcon,
    PinOutlineIcon,
    ReplyOutlineIcon,
    TranslateIcon,
    TrashCanOutlineIcon,
} from '@mattermost/compass-icons/components';
import type {Post} from '@mattermost/types/posts';
import type {UserThread} from '@mattermost/types/threads';

import Permissions from 'mattermost-redux/constants/permissions';

import {closeModal} from 'actions/views/modals';

import BurnOnReadConfirmationModal from 'components/burn_on_read_confirmation_modal';
import DeletePostModal from 'components/delete_post_modal';
import FlagPostModal from 'components/flag_message_modal/flag_post_modal';
import ForwardPostModal from 'components/forward_post_modal';
import * as Menu from 'components/menu';
import MoveThreadModal from 'components/move_thread_modal';
import ChannelPermissionGate from 'components/permissions_gates/channel_permission_gate';

import {createBurnOnReadDeleteModalHandlers} from 'hooks/useBurnOnReadDeleteModal';
import {getPostAgentomId} from 'utils/agentom_ids';
import {Locations, ModalIdentifiers, Constants} from 'utils/constants';
import DelayedAction from 'utils/delayed_action';
import * as Keyboard from 'utils/keyboard';
import {describeActions} from 'utils/popup_descriptions';
import * as PostUtils from 'utils/post_utils';
import * as Utils from 'utils/utils';

import type {ModalData} from 'types/actions';

import PostReminderSubMenu, {postReminderMessages} from './post_reminder_submenu';

import './dot_menu.scss';

type ChangeEvent = React.KeyboardEvent | React.MouseEvent;

type ShortcutKeyProps = {
    shortcutKey: string;
};

// The key is shown, and given to assistive technology by the item's aria-keyshortcuts, so it stays out of the
// item's name ("Reply", not "Reply R").
const ShortcutKey = ({shortcutKey: shortcut}: ShortcutKeyProps) => (
    <span aria-hidden='true'>
        {shortcut}
    </span>
);

// The items' labels, used by the items and by the menu button's description of them
export const dotMenuMessages = defineMessages({
    reply: {
        id: 'post_info.reply',
        defaultMessage: 'Reply',
    },
    forward: {
        id: 'forward_post_button.label',
        defaultMessage: 'Forward',
    },
    addReaction: {
        id: 'rhs_root.mobile.add_reaction',
        defaultMessage: 'Add Reaction',
    },
    unfollowThread: {
        id: 'threading.threadMenu.unfollow',
        defaultMessage: 'Unfollow thread',
    },
    unfollowMessage: {
        id: 'threading.threadMenu.unfollowMessage',
        defaultMessage: 'Unfollow message',
    },
    followThread: {
        id: 'threading.threadMenu.follow',
        defaultMessage: 'Follow thread',
    },
    followMessage: {
        id: 'threading.threadMenu.followMessage',
        defaultMessage: 'Follow message',
    },
    markAsUnread: {
        id: 'post_info.unread',
        defaultMessage: 'Mark as Unread',
    },
    removeFromSaved: {
        id: 'rhs_root.mobile.unflag',
        defaultMessage: 'Remove from Saved',
    },
    save: {
        id: 'rhs_root.mobile.flag',
        defaultMessage: 'Save Message',
    },
    pin: {
        id: 'post_info.pin',
        defaultMessage: 'Pin to Channel',
    },
    unpin: {
        id: 'post_info.unpin',
        defaultMessage: 'Unpin from Channel',
    },
    moveThread: {
        id: 'post_info.move_thread',
        defaultMessage: 'Move Thread',
    },
    showTranslation: {
        id: 'post_info.show_translation',
        defaultMessage: 'Show translation',
    },
    copyText: {
        id: 'post_info.copy',
        defaultMessage: 'Copy Text',
    },
    copyLink: {
        id: 'post_info.permalink',
        defaultMessage: 'Copy Link',
    },
    edit: {
        id: 'post_info.edit',
        defaultMessage: 'Edit',
    },
    quarantine: {
        id: 'post_info.quarantine',
        defaultMessage: 'Quarantine for Review',
    },
    delete: {
        id: 'post_info.del',
        defaultMessage: 'Delete',
    },

    // Descriptions of the items that open a dialog (what it asks for) or that do more than their label says
    forwardDescription: {
        id: 'post_info.forward.description',
        defaultMessage: 'Asks for the channel or people to forward the message to, and an optional comment, then forwards it',
    },
    moveThreadDescription: {
        id: 'post_info.move_thread.description',
        defaultMessage: 'Asks for the channel to move the thread to, then moves it',
    },
    showTranslationDescription: {
        id: 'post_info.show_translation.description',
        defaultMessage: 'Shows the original message and its translation',
    },
    copyLinkDescription: {
        id: 'post_info.permalink.description',
        defaultMessage: 'Copies the link to this message: {link}',
    },
    quarantineDescription: {
        id: 'post_info.quarantine.description',
        defaultMessage: 'Asks for a reason and a comment, then sends the message to content reviewers',
    },
    deleteDescription: {
        id: 'post_info.del.description',
        defaultMessage: 'Asks for confirmation, then deletes the message',
    },
    deleteWithRepliesDescription: {
        id: 'post_info.del.description_with_replies',
        defaultMessage: 'Asks for confirmation, then deletes the message and its replies',
    },
});

function getMessageToCopy(post: Post, isChannelAutotranslated: boolean, locale: string): string {
    const originalMessage = post.message_source || post.message;
    if (!isChannelAutotranslated || post.type !== '') {
        return originalMessage;
    }
    const translation = PostUtils.getPostTranslation(post, locale);
    if (!translation || translation.state !== 'ready') {
        return originalMessage;
    }
    return PostUtils.getPostTranslatedMessage(originalMessage, translation);
}

type Props = {
    intl: IntlShape;
    post: Post;
    teamId: string;
    location?: keyof typeof Constants.Locations;
    isFlagged?: boolean;
    handleCommentClick?: React.EventHandler<any>;
    handleDropdownOpened: (open: boolean) => void;
    handleAddReactionClick?: (showEmojiPicker: boolean) => void;
    isMenuOpen?: boolean;
    isReadOnly?: boolean;
    isLicensed?: boolean; // TechDebt: Made non-mandatory while converting to typescript
    postEditTimeLimit?: string; // TechDebt: Made non-mandatory while converting to typescript
    enableEmojiPicker?: boolean; // TechDebt: Made non-mandatory while converting to typescript
    channelIsArchived?: boolean; // TechDebt: Made non-mandatory while converting to typescript
    teamUrl?: string; // TechDebt: Made non-mandatory while converting to typescript
    isMobileView: boolean;
    timezone?: string;
    isMilitaryTime: boolean;
    canMove: boolean;
    canReply: boolean;
    canForward: boolean;
    canFollowThread: boolean;
    canPin: boolean;
    canCopyText: boolean;
    canCopyLink: boolean;
    canFlagContent?: boolean;

    actions: {

        /**
         * Function flag the post
         */
        flagPost: (postId: string) => void;

        /**
         * Function to unflag the post
         */
        unflagPost: (postId: string) => void;

        /**
         * Function to set the editing post
         */
        setEditingPost: (postId?: string, refocusId?: string, isRHS?: boolean) => void;

        /**
         * Function to pin the post
         */
        pinPost: (postId: string) => void;

        /**
         * Function to unpin the post
         */
        unpinPost: (postId: string) => void;

        /**
         * Function to open a modal
         */
        openModal: <P>(modalData: ModalData<P>) => void;

        /**
         * Function to close a modal
         */
        closeModal: (modalId: string) => void;

        /**
         * Function to set the unread mark at given post
         */
        markPostAsUnread: (post: Post, location?: string) => void;

        /**
         * Function to set the thread as followed/unfollowed
         */
        setThreadFollow: (userId: string, teamId: string, threadId: string, newState: boolean) => void;

        /**
         * Function to burn a BoR post now
         */
        burnPostNow?: (postId: string) => Promise<any>;

        /**
         * Function to save user preferences
         */
        savePreferences: (userId: string, preferences: Array<{category: string; user_id: string; name: string; value: string}>) => void;

    }; // TechDebt: Made non-mandatory while converting to typescript

    canEdit: boolean;
    canDelete: boolean;
    userId: string;
    threadId: UserThread['id'];
    isFollowingThread?: boolean;
    isMentionedInRootPost?: boolean;
    threadReplyCount?: number;
    isChannelAutotranslated: boolean;
    isBurnOnReadPost: boolean;
    isUnrevealedBurnOnReadPost: boolean;

    /**
     * Whether the user may add reactions in the post's channel (for the menu button's description)
     */
    canAddReaction?: boolean;

    /**
     * The number of replies to the post, which deleting it also deletes
     */
    commentCount?: number;
};

type State = {
    canEdit: boolean;
    canDelete: boolean;
};

export class DotMenuClass extends React.PureComponent<Props, State> {
    public static defaultProps: Partial<Props> = {
        isFlagged: false,
        isReadOnly: false,
        location: Locations.CENTER,
    };
    private editDisableAction: DelayedAction;

    constructor(props: Props) {
        super(props);

        this.editDisableAction = new DelayedAction(this.handleEditDisable);

        this.state = {
            canEdit: props.canEdit && !props.isReadOnly,
            canDelete: props.canDelete && !props.isReadOnly,
        };
    }

    static getDerivedStateFromProps(props: Props) {
        const state: Partial<State> = {
            canEdit: props.canEdit && !props.isReadOnly,
            canDelete: props.canDelete && !props.isReadOnly,
        };

        return state;
    }

    disableCanEditPostByTime() {
        const {post, isLicensed} = this.props;
        const {canEdit} = this.state;

        const postEditTimeLimit = this.props.postEditTimeLimit || Constants.UNSET_POST_EDIT_TIME_LIMIT;

        if (canEdit && isLicensed) {
            if (postEditTimeLimit !== String(Constants.UNSET_POST_EDIT_TIME_LIMIT)) {
                const milliseconds = 1000;
                const timeLeft = (post.create_at + (Number(postEditTimeLimit) * milliseconds)) - Utils.getTimestamp();
                if (timeLeft > 0) {
                    this.editDisableAction.fireAfter(timeLeft + milliseconds);
                }
            }
        }
    }

    componentDidMount() {
        this.disableCanEditPostByTime();
    }

    componentWillUnmount() {
        this.editDisableAction.cancel();
    }

    handleEditDisable = () => {
        this.setState({canEdit: false});
    };

    handleFlagMenuItemActivated = () => {
        if (this.props.isFlagged) {
            this.props.actions.unflagPost(this.props.post.id);
        } else {
            this.props.actions.flagPost(this.props.post.id);
        }
    };

    handleAddReactionMenuItemActivated = () => {
        if (this.props.handleAddReactionClick) {
            this.props.handleAddReactionClick(true);
        }
    };

    getPermalink = () => `${this.props.teamUrl}/pl/${this.props.post.id}`;

    copyLink = () => {
        Utils.copyToClipboard(this.getPermalink());
    };

    copyText = () => {
        Utils.copyToClipboard(getMessageToCopy(this.props.post, this.props.isChannelAutotranslated, this.props.intl.locale));
    };

    handlePinMenuItemActivated = (): void => {
        if (this.props.post.is_pinned) {
            this.props.actions.unpinPost(this.props.post.id);
        } else {
            this.props.actions.pinPost(this.props.post.id);
        }
    };

    handleMarkPostAsUnread = (): void => {
        this.props.actions.markPostAsUnread(this.props.post, this.props.location);
    };

    handleDeleteMenuItemActivated = (): void => {
        // For BoR posts, use BurnOnReadConfirmationModal instead of DeletePostModal
        if (this.props.isBurnOnReadPost) {
            const isSender = this.props.post.user_id === this.props.userId;

            // Use shared helper to create modal handlers
            const handlers = createBurnOnReadDeleteModalHandlers(
                this.props.actions,
                {
                    postId: this.props.post.id,
                    userId: this.props.userId,
                    isSender,
                },
            );

            const burnOnReadModalData = {
                modalId: ModalIdentifiers.BURN_ON_READ_CONFIRMATION,
                dialogType: BurnOnReadConfirmationModal,
                dialogProps: {
                    show: true,
                    ...handlers,
                },
            };

            this.props.actions.openModal(burnOnReadModalData);
        } else {
            const deletePostModalData = {
                modalId: ModalIdentifiers.DELETE_POST,
                dialogType: DeletePostModal,
                dialogProps: {
                    post: this.props.post,
                    isRHS: this.props.location === Locations.RHS_ROOT || this.props.location === Locations.RHS_COMMENT,
                },
            };

            this.props.actions.openModal(deletePostModalData);
        }
    };

    handleFlagPostMenuItemClicked = () => {
        const flagPostModalData = {
            modalId: ModalIdentifiers.FLAG_POST,
            dialogType: FlagPostModal,
            dialogProps: {
                postId: this.props.post.id,
                onExited: () => closeModal(ModalIdentifiers.FLAG_POST),
            },
        };

        this.props.actions.openModal(flagPostModalData);
    };

    handleMoveThreadMenuItemActivated = (e: ChangeEvent): void => {
        e.preventDefault();
        if (!this.props.canMove) {
            return;
        }

        const moveThreadModalData = {
            modalId: ModalIdentifiers.MOVE_THREAD_MODAL,
            dialogType: MoveThreadModal,
            dialogProps: {
                post: this.props.post,
            },
        };

        this.props.actions.openModal(moveThreadModalData);
    };

    handleForwardMenuItemActivated = (): void => {
        if (!this.props.canForward) {
            // adding this early return since only hiding the Item from the menu is not enough,
            // since a user can always use the Shortcuts to activate the function as well
            return;
        }

        const forwardPostModalData = {
            modalId: ModalIdentifiers.FORWARD_POST_MODAL,
            dialogType: ForwardPostModal,
            dialogProps: {
                post: this.props.post,
            },
        };

        this.props.actions.openModal(forwardPostModalData);
    };

    handleEditMenuItemActivated = (): void => {
        this.props.handleDropdownOpened?.(false);
        this.props.actions.setEditingPost(
            this.props.post.id,
            this.props.location === Locations.CENTER ? 'post_textbox' : 'reply_textbox',
            this.props.location === Locations.RHS_ROOT || this.props.location === Locations.RHS_COMMENT || this.props.location === Locations.SEARCH,
        );
    };

    handleSetThreadFollow = () => {
        const {actions, teamId, threadId, userId, isFollowingThread, isMentionedInRootPost} = this.props;
        let followingThread: boolean;

        // This is required as post with mention doesn't have isFollowingThread property set to true but user with mention is following, so we will get null as value kind of hack for this.

        if (isFollowingThread === null) {
            followingThread = !isMentionedInRootPost;
        } else {
            followingThread = !isFollowingThread;
        }
        actions.setThreadFollow(
            userId,
            teamId,
            threadId,
            followingThread,
        );
    };

    handleCommentClick = (e: ChangeEvent) => {
        this.props.handleCommentClick?.(e);
    };

    handleMenuKeydown = (event: React.KeyboardEvent<HTMLDivElement>, forceCloseMenu?: (() => void)) => {
        event.preventDefault();

        if (!forceCloseMenu) {
            return;
        }

        const isShiftKeyPressed = event.shiftKey;

        switch (true) {
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.R):
            if (this.props.canReply) {
                forceCloseMenu();
                this.handleCommentClick(event);
            }
            break;

            // edit post
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.E):
            if (this.state.canEdit) {
                forceCloseMenu();
                this.handleEditMenuItemActivated();
            }
            break;

            // follow thread
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.F) && !isShiftKeyPressed:
            if (this.props.canFollowThread) {
                forceCloseMenu();
                this.handleSetThreadFollow();
            }
            break;

            // forward post
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.F) && isShiftKeyPressed:
            if (this.props.canForward) {
                forceCloseMenu();
                this.handleForwardMenuItemActivated();
            }
            break;

            // copy link
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.K):
            if (this.props.canCopyLink) {
                forceCloseMenu();
                this.copyLink();
            }
            break;

            // copy text
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.C):
            if (this.props.canCopyText) {
                forceCloseMenu();
                this.copyText();
            }
            break;

            // delete post
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.DELETE):
            forceCloseMenu();
            this.handleDeleteMenuItemActivated();
            break;

            // move thread
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.W):
            if (this.props.canMove) {
                forceCloseMenu();
                this.handleMoveThreadMenuItemActivated(event);
            }
            break;

            // pin / unpin
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.P):
            if (this.props.canPin && !this.props.isReadOnly) {
                forceCloseMenu();
                this.handlePinMenuItemActivated();
            }
            break;

            // save / unsave
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.S):
            forceCloseMenu();
            this.handleFlagMenuItemActivated();
            break;

            // mark as unread
        case Keyboard.isKeyPressed(event, Constants.KeyCodes.U):
            forceCloseMenu();
            this.handleMarkPostAsUnread();
            break;
        }
    };

    handleMenuToggle = (open: boolean) => {
        this.props.handleDropdownOpened?.(open);
    };

    handleShowTranslation = async () => {
        // Use dynamic import to avoid circular dependency
        // This breaks the cycle because the import only happens at runtime, not at module load time
        const {default: ShowTranslationModal} = await import('components/show_translation_modal');
        this.props.actions.openModal({
            modalId: ModalIdentifiers.SHOW_TRANSLATION,
            dialogType: ShowTranslationModal,
            dialogProps: {postId: this.props.post.id},
        });
    };

    render(): JSX.Element {
        const {formatMessage} = this.props.intl;
        const isFollowingThread = this.props.isFollowingThread ?? this.props.isMentionedInRootPost;
        const isMobile = this.props.isMobileView;
        const isSystemMessage = PostUtils.isSystemMessage(this.props.post);
        const isBurnOnReadPost = this.props.isBurnOnReadPost;
        const isBurnOnReadPostSender = isBurnOnReadPost && this.props.post.user_id === this.props.userId;

        // Determine if delete should show for BoR posts
        const shouldShowDeleteForBoR = isBurnOnReadPost && (
            isBurnOnReadPostSender || // Sender always sees delete
            !this.props.isUnrevealedBurnOnReadPost // Receiver sees delete only if revealed (not concealed)
        );

        const translation = PostUtils.getPostTranslation(this.props.post, this.props.intl.locale);
        const showTranslation = this.props.isChannelAutotranslated && translation?.state === 'ready' && this.props.post.type === '';

        const forwardPostItemText = (
            <span className={'dot-menu__item-new-badge'}>
                <FormattedMessage {...dotMenuMessages.forward}/>
            </span>
        );

        let followPostMessage: MessageDescriptor;
        if (isFollowingThread) {
            followPostMessage = this.props.threadReplyCount ? dotMenuMessages.unfollowThread : dotMenuMessages.unfollowMessage;
        } else {
            followPostMessage = this.props.threadReplyCount ? dotMenuMessages.followThread : dotMenuMessages.followMessage;
        }

        const saveMessage = this.props.isFlagged ? dotMenuMessages.removeFromSaved : dotMenuMessages.save;
        const pinMessage = this.props.post.is_pinned ? dotMenuMessages.unpin : dotMenuMessages.pin;

        const showReply = !isSystemMessage && !isBurnOnReadPost && this.props.location === Locations.CENTER;
        const showForward = this.props.canForward;
        const showReactions = Boolean(isMobile && !isSystemMessage && !this.props.isReadOnly && this.props.enableEmojiPicker);
        const showFollowPost = this.props.canFollowThread;
        const showMarkAsUnread = Boolean(!isSystemMessage && !this.props.channelIsArchived && this.props.location !== Locations.SEARCH);
        const showSave = !isSystemMessage && !this.props.isUnrevealedBurnOnReadPost;
        const showRemind = !isSystemMessage;
        const showPin = Boolean(!isSystemMessage && !this.props.isReadOnly && !isBurnOnReadPost);
        const showMove = Boolean(!isSystemMessage && this.props.canMove);
        const showShowTranslation = !isSystemMessage && showTranslation;
        const showCopyText = !isSystemMessage && !isBurnOnReadPost;
        const showCopyLink = !isSystemMessage && (!isBurnOnReadPost || this.props.post.user_id === this.props.userId);
        const showEdit = this.state.canEdit && !isBurnOnReadPost;
        const showFlagContent = this.props.canFlagContent;

        // Delete button should show if:
        // 1. Non-BoR with delete permission, OR
        // 2. BoR post meeting above criteria
        const showDelete = (!isBurnOnReadPost && this.state.canDelete) || shouldShowDeleteForBoR;

        const firstSectionHasItems = showReply || showForward || showReactions || showFollowPost || showMarkAsUnread || showSave || showRemind || showPin || showMove;
        const secondSectionHasItems = showShowTranslation || showCopyText || showCopyLink;
        const thirdSectionHasItems = showEdit || showDelete || showFlagContent;

        // The menu button names the items the menu holds, in its order and under the same conditions (Add Reaction
        // also needs the permission its gate checks)
        const actionLabels: MessageDescriptor[] = [];
        if (showReply) {
            actionLabels.push(dotMenuMessages.reply);
        }
        if (showForward) {
            actionLabels.push(dotMenuMessages.forward);
        }
        if (showReactions && this.props.canAddReaction) {
            actionLabels.push(dotMenuMessages.addReaction);
        }
        if (showFollowPost) {
            actionLabels.push(followPostMessage);
        }
        if (showMarkAsUnread) {
            actionLabels.push(dotMenuMessages.markAsUnread);
        }
        if (showSave) {
            actionLabels.push(saveMessage);
        }
        if (showRemind) {
            actionLabels.push(postReminderMessages.remind);
        }
        if (showPin) {
            actionLabels.push(pinMessage);
        }
        if (showMove) {
            actionLabels.push(dotMenuMessages.moveThread);
        }
        if (showShowTranslation) {
            actionLabels.push(dotMenuMessages.showTranslation);
        }
        if (showCopyText) {
            actionLabels.push(dotMenuMessages.copyText);
        }
        if (showCopyLink) {
            actionLabels.push(dotMenuMessages.copyLink);
        }
        if (showEdit) {
            actionLabels.push(dotMenuMessages.edit);
        }
        if (showFlagContent) {
            actionLabels.push(dotMenuMessages.quarantine);
        }
        if (showDelete) {
            actionLabels.push(dotMenuMessages.delete);
        }

        const postAgentomId = getPostAgentomId(this.props.location, this.props.post.id);
        const menuButtonId = `${this.props.location}_button_${this.props.post.id}`;
        const descriptionId = (item: string) => `${this.props.location}_${item}_description_${this.props.post.id}`;

        // Deleting a thread's first message deletes its replies too, which the dialog warns about
        const deletesReplies = !this.props.post.root_id && (this.props.commentCount ?? 0) > 0;

        return (
            <>
                <Menu.Container
                    menuButton={{
                        id: menuButtonId,
                        dataTestId: `PostDotMenu-Button-${this.props.post.id}`,
                        class: classNames('post-menu__item', {
                            'post-menu__item--active': this.props.isMenuOpen,
                        }),
                        'aria-label': formatMessage({id: 'post_info.dot_menu.tooltip.more', defaultMessage: 'More'}).toLowerCase(),
                        'aria-describedby': actionLabels.length ? descriptionId('actions') : undefined,
                        agentomId: `${postAgentomId}.menu`,
                        children: <DotsHorizontalIcon size={16}/>,
                    }}
                    menu={{
                        id: `${this.props.location}_dropdown_${this.props.post.id}`,
                        'aria-label': formatMessage({id: 'post_info.menuAriaLabel', defaultMessage: 'Post extra options'}),
                        onKeyDown: this.handleMenuKeydown,
                        width: '264px',
                        onToggle: this.handleMenuToggle,
                    }}
                    menuButtonTooltip={{
                        text: formatMessage({id: 'post_info.dot_menu.tooltip.more', defaultMessage: 'More'}),
                        class: 'hidden-xs',
                    }}
                >
                    {showReply &&
                        <Menu.Item
                            id={`reply_to_post_${this.props.post.id}`}
                            data-testid={`reply_to_post_${this.props.post.id}`}
                            labels={<FormattedMessage {...dotMenuMessages.reply}/>}
                            leadingElement={<ReplyOutlineIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='R'/>}
                            aria-keyshortcuts='R'
                            onClick={this.handleCommentClick}
                        />
                    }
                    {showForward &&
                        <Menu.Item
                            id={`forward_post_${this.props.post.id}`}
                            data-testid={`forward_post_${this.props.post.id}`}
                            labels={forwardPostItemText}
                            isLabelsRowLayout={true}
                            leadingElement={<ArrowRightBoldOutlineIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='Shift + F'/>}
                            aria-keyshortcuts='Shift+F'
                            aria-haspopup='dialog'
                            aria-describedby={descriptionId('forward')}
                            onClick={this.handleForwardMenuItemActivated}
                        >
                            <span
                                id={descriptionId('forward')}
                                hidden={true}
                            >
                                {formatMessage(dotMenuMessages.forwardDescription)}
                            </span>
                        </Menu.Item>
                    }
                    {showReactions &&
                        <ChannelPermissionGate
                            channelId={this.props.post.channel_id}
                            teamId={this.props.teamId}
                            permissions={[Permissions.ADD_REACTION]}
                        >
                            <Menu.Item
                                id={`post_reaction_${this.props.post.id}`}
                                data-testid={`post_reaction_${this.props.post.id}`}
                                labels={<FormattedMessage {...dotMenuMessages.addReaction}/>}
                                leadingElement={<EmoticonPlusOutlineIcon size={18}/>}
                                onClick={this.handleAddReactionMenuItemActivated}
                            />
                        </ChannelPermissionGate>
                    }
                    {showFollowPost &&
                        <Menu.Item
                            id={`follow_post_thread_${this.props.post.id}`}
                            data-testid={`follow_post_thread_${this.props.post.id}`}

                            // The label flips between following and unfollowing, so the id is pinned
                            data-agentom-id={`${postAgentomId}.menu.follow`}
                            trailingElements={<ShortcutKey shortcutKey='F'/>}
                            aria-keyshortcuts='F'
                            labels={<FormattedMessage {...followPostMessage}/>}
                            leadingElement={
                                isFollowingThread ? (
                                    <MessageMinusOutlineIcon size={18}/>
                                ) : (
                                    <MessageCheckOutlineIcon size={18}/>
                                )
                            }
                            onClick={this.handleSetThreadFollow}
                        />
                    }
                    {showMarkAsUnread &&
                        <Menu.Item
                            id={`unread_post_${this.props.post.id}`}
                            data-testid={`unread_post_${this.props.post.id}`}
                            labels={<FormattedMessage {...dotMenuMessages.markAsUnread}/>}
                            leadingElement={<MarkAsUnreadIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='U'/>}
                            aria-keyshortcuts='U'
                            onClick={this.handleMarkPostAsUnread}
                        />
                    }
                    {showSave &&
                        <Menu.Item
                            id={`save_post_${this.props.post.id}`}
                            data-testid={`save_post_${this.props.post.id}`}
                            data-agentom-id={`${postAgentomId}.menu.save`}
                            labels={<FormattedMessage {...saveMessage}/>}
                            leadingElement={this.props.isFlagged ? <BookmarkIcon size={18}/> : <BookmarkOutlineIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='S'/>}
                            aria-keyshortcuts='S'
                            onClick={this.handleFlagMenuItemActivated}
                        />
                    }
                    {showRemind &&
                        <PostReminderSubMenu
                            userId={this.props.userId}
                            post={this.props.post}
                            isMilitaryTime={this.props.isMilitaryTime}
                            timezone={this.props.timezone}
                        />
                    }
                    {showPin &&
                        <Menu.Item
                            id={`${this.props.post.is_pinned ? 'unpin' : 'pin'}_post_${this.props.post.id}`}
                            data-testid={`pin_post_${this.props.post.id}`}
                            data-agentom-id={`${postAgentomId}.menu.pin`}
                            labels={<FormattedMessage {...pinMessage}/>}
                            leadingElement={this.props.post.is_pinned ? <PinIcon size={18}/> : <PinOutlineIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='P'/>}
                            aria-keyshortcuts='P'
                            onClick={this.handlePinMenuItemActivated}
                        />
                    }
                    {showMove &&
                        <Menu.Item
                            id={`move_thread_${this.props.post.id}`}
                            labels={<FormattedMessage {...dotMenuMessages.moveThread}/>}
                            leadingElement={<MessageArrowRightOutlineIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='W'/>}
                            aria-keyshortcuts='W'
                            aria-haspopup='dialog'
                            aria-describedby={descriptionId('move')}
                            onClick={this.handleMoveThreadMenuItemActivated}
                        >
                            <span
                                id={descriptionId('move')}
                                hidden={true}
                            >
                                {formatMessage(dotMenuMessages.moveThreadDescription)}
                            </span>
                        </Menu.Item>
                    }
                    {firstSectionHasItems && secondSectionHasItems && <Menu.Separator/>}
                    {showShowTranslation && (
                        <Menu.Item
                            id={`show_translation_${this.props.post.id}`}
                            data-testid={`show_translation_${this.props.post.id}`}
                            labels={<FormattedMessage {...dotMenuMessages.showTranslation}/>}
                            leadingElement={<TranslateIcon size={18}/>}
                            aria-haspopup='dialog'
                            aria-describedby={descriptionId('translation')}
                            onClick={this.handleShowTranslation}
                        >
                            <span
                                id={descriptionId('translation')}
                                hidden={true}
                            >
                                {formatMessage(dotMenuMessages.showTranslationDescription)}
                            </span>
                        </Menu.Item>
                    )}
                    {showCopyText &&
                        <Menu.Item
                            id={`copy_${this.props.post.id}`}
                            data-testid={`copy_${this.props.post.id}`}
                            labels={<FormattedMessage {...dotMenuMessages.copyText}/>}
                            leadingElement={<ContentCopyIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='C'/>}
                            aria-keyshortcuts='C'
                            onClick={this.copyText}
                        />
                    }
                    {showCopyLink &&
                        <Menu.Item
                            id={`permalink_${this.props.post.id}`}
                            data-testid={`permalink_${this.props.post.id}`}
                            labels={<FormattedMessage {...dotMenuMessages.copyLink}/>}
                            leadingElement={<LinkVariantIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='K'/>}
                            aria-keyshortcuts='K'
                            aria-describedby={descriptionId('permalink')}
                            onClick={this.copyLink}
                        >
                            <span
                                id={descriptionId('permalink')}
                                hidden={true}
                            >
                                {formatMessage(dotMenuMessages.copyLinkDescription, {link: this.getPermalink()})}
                            </span>
                        </Menu.Item>
                    }
                    {thirdSectionHasItems && (firstSectionHasItems || secondSectionHasItems) && <Menu.Separator/>}
                    {showEdit &&
                        <Menu.Item
                            id={`edit_post_${this.props.post.id}`}
                            data-testid={`edit_post_${this.props.post.id}`}
                            labels={<FormattedMessage {...dotMenuMessages.edit}/>}
                            leadingElement={<PencilOutlineIcon size={18}/>}
                            trailingElements={<ShortcutKey shortcutKey='E'/>}
                            aria-keyshortcuts='E'
                            onClick={this.handleEditMenuItemActivated}
                        />
                    }
                    {
                        showFlagContent &&
                        <Menu.Item
                            id={`flag_post_${this.props.post.id}`}
                            className='flag_post_menu_item'
                            data-testid={`flag_post_${this.props.post.id}`}
                            data-agentom-id={`${postAgentomId}.menu.quarantine`}
                            data-agentom-risk='sensitive'
                            data-agentom-confirmation='required'
                            aria-haspopup='dialog'
                            aria-describedby={descriptionId('quarantine')}
                            leadingElement={<AlertOutlineIcon size={18}/>}
                            labels={<FormattedMessage {...dotMenuMessages.quarantine}/>}
                            onClick={this.handleFlagPostMenuItemClicked}
                            isDestructive={true}
                        >
                            <span
                                id={descriptionId('quarantine')}
                                hidden={true}
                            >
                                {formatMessage(dotMenuMessages.quarantineDescription)}
                            </span>
                        </Menu.Item>
                    }
                    {showDelete &&
                        <Menu.Item
                            id={`delete_post_${this.props.post.id}`}
                            data-testid={`delete_post_${this.props.post.id}`}

                            // It always opens a dialog that asks to confirm (DeletePostModal, or for a burn-on-read
                            // message BurnOnReadConfirmationModal)
                            data-agentom-id={`${postAgentomId}.menu.delete`}
                            data-agentom-risk='destructive'
                            data-agentom-confirmation='required'
                            aria-haspopup='dialog'
                            aria-describedby={descriptionId('delete')}
                            aria-keyshortcuts='Delete'
                            leadingElement={<TrashCanOutlineIcon size={18}/>}
                            trailingElements={<span aria-hidden='true'>{'delete'}</span>}
                            labels={<FormattedMessage {...dotMenuMessages.delete}/>}
                            onClick={this.handleDeleteMenuItemActivated}
                            isDestructive={true}
                        >
                            <span
                                id={descriptionId('delete')}
                                hidden={true}
                            >
                                {formatMessage(deletesReplies ? dotMenuMessages.deleteWithRepliesDescription : dotMenuMessages.deleteDescription)}
                            </span>
                        </Menu.Item>
                    }
                </Menu.Container>
                {actionLabels.length > 0 && (
                    <span
                        id={descriptionId('actions')}
                        hidden={true}
                    >
                        {describeActions(this.props.intl, actionLabels)}
                    </span>
                )}
            </>
        );
    }
}

export default injectIntl(DotMenuClass);
