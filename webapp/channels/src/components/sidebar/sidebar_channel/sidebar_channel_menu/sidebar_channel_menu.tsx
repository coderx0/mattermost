// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useRef, memo, type JSX} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import type {MessageDescriptor} from 'react-intl';
import {useSelector} from 'react-redux';

import {
    MarkAsUnreadIcon,
    StarIcon,
    StarOutlineIcon,
    BellOutlineIcon,
    BellOffOutlineIcon,
    LinkVariantIcon,
    AccountPlusOutlineIcon,
    DotsVerticalIcon,
    ExitToAppIcon,
} from '@mattermost/compass-icons/components';
import {WithTooltip} from '@mattermost/shared/components/tooltip';

import {isChannelInManagedCategory} from 'mattermost-redux/selectors/entities/channel_categories';

import MenuItemOpenInNewWindow from 'components/channel_header_menu/menu_items/open_in_new_window';
import ChannelInviteModal from 'components/channel_invite_modal';
import ChannelMoveToSubmenu, {channelMoveToSubMenuMessages} from 'components/channel_move_to_sub_menu';
import * as Menu from 'components/menu';
import {popoutMenuItemMessages} from 'components/popout_menu_item';

import Constants, {ModalIdentifiers} from 'utils/constants';
import {canPopout, isChannelPopoutWindow} from 'utils/popouts/popout_windows';
import {describeActions} from 'utils/popup_descriptions';
import {copyToClipboard} from 'utils/utils';

import type {GlobalState} from 'types/store';

import type {PropsFromRedux, OwnProps} from './index';

type Props = PropsFromRedux & OwnProps;

const messages = defineMessages({
    markAsRead: {
        id: 'sidebar_left.sidebar_channel_menu.markAsRead',
        defaultMessage: 'Mark as Read',
    },
    markAsUnread: {
        id: 'sidebar_left.sidebar_channel_menu.markAsUnread',
        defaultMessage: 'Mark as Unread',
    },
    unfavoriteChannel: {
        id: 'sidebar_left.sidebar_channel_menu.unfavoriteChannel',
        defaultMessage: 'Unfavorite',
    },
    favoriteChannel: {
        id: 'sidebar_left.sidebar_channel_menu.favoriteChannel',
        defaultMessage: 'Favorite',
    },
    unmuteChannel: {
        id: 'sidebar_left.sidebar_channel_menu.unmuteChannel',
        defaultMessage: 'Unmute Channel',
    },
    unmute: {
        id: 'sidebar_left.sidebar_channel_menu.unmute',
        defaultMessage: 'Unmute',
    },
    muteChannel: {
        id: 'sidebar_left.sidebar_channel_menu.muteChannel',
        defaultMessage: 'Mute Channel',
    },
    mute: {
        id: 'sidebar_left.sidebar_channel_menu.mute',
        defaultMessage: 'Mute',
    },
    copyLink: {
        id: 'sidebar_left.sidebar_channel_menu.copyLink',
        defaultMessage: 'Copy Link',
    },
    addMembers: {
        id: 'sidebar_left.sidebar_channel_menu.addMembers',
        defaultMessage: 'Add Members',
    },
    leaveChannel: {
        id: 'sidebar_left.sidebar_channel_menu.leaveChannel',
        defaultMessage: 'Leave Channel',
    },
    leaveConversation: {
        id: 'sidebar_left.sidebar_channel_menu.leaveConversation',
        defaultMessage: 'Close Conversation',
    },
});

const SidebarChannelMenu = ({
    agentomId,
    channel,
    channelLabel,
    channelLink,
    currentUserId,
    favoriteChannel,
    isFavorite,
    isMuted,
    isUnread,
    managePrivateChannelMembers,
    managePublicChannelMembers,
    readMultipleChannels,
    markMostRecentPostInChannelAsUnread,
    muteChannel,
    onMenuToggle,
    openModal,
    unfavoriteChannel,
    unmuteChannel,
    channelLeaveHandler,
    channelLeaveNeedsConfirmation,
}: Props) => {
    const isLeaving = useRef(false);
    const isInManagedCategory = useSelector((state: GlobalState) => isChannelInManagedCategory(state, channel.id));

    const intl = useIntl();
    const {formatMessage} = intl;

    // The labels of the actions the menu offers, in its order, for the button's description
    const actionLabels: MessageDescriptor[] = [];

    const showOpenInNewWindow = canPopout() && !isChannelPopoutWindow();
    if (showOpenInNewWindow) {
        actionLabels.push(popoutMenuItemMessages.openInNewWindow);
    }

    let markAsReadUnreadMenuItem: JSX.Element | null = null;
    if (isUnread) {
        function handleMarkAsRead() {
            // We use mark multiple to not update the active channel in the server
            readMultipleChannels([channel.id]);
        }

        markAsReadUnreadMenuItem = (
            <Menu.Item
                id={`markAsRead-${channel.id}`}
                onClick={handleMarkAsRead}
                leadingElement={<MarkAsUnreadIcon size={18}/>}
                labels={<FormattedMessage {...messages.markAsRead}/>}
            />

        );
        actionLabels.push(messages.markAsRead);
    } else {
        function handleMarkAsUnread() {
            markMostRecentPostInChannelAsUnread(channel.id);
        }

        markAsReadUnreadMenuItem = (
            <Menu.Item
                id={`markAsUnread-${channel.id}`}
                onClick={handleMarkAsUnread}
                leadingElement={<MarkAsUnreadIcon size={18}/>}
                labels={<FormattedMessage {...messages.markAsUnread}/>}
            />
        );
        actionLabels.push(messages.markAsUnread);
    }

    let favoriteItem: JSX.Element;
    if (isFavorite) {
        function handleUnfavoriteChannel() {
            unfavoriteChannel(channel.id);
        }

        favoriteItem = (
            <Menu.Item
                id={`unfavorite-${channel.id}`}
                onClick={handleUnfavoriteChannel}
                leadingElement={<StarIcon size={18}/>}
                labels={<FormattedMessage {...messages.unfavoriteChannel}/>}
                disabled={isInManagedCategory}
            />
        );
        if (!isInManagedCategory) {
            actionLabels.push(messages.unfavoriteChannel);
        }
    } else {
        function handleFavoriteChannel() {
            favoriteChannel(channel.id);
        }

        favoriteItem = (
            <Menu.Item
                id={`favorite-${channel.id}`}
                onClick={handleFavoriteChannel}
                leadingElement={<StarOutlineIcon size={18}/>}
                labels={<FormattedMessage {...messages.favoriteChannel}/>}
                disabled={isInManagedCategory}
            />
        );
        if (!isInManagedCategory) {
            actionLabels.push(messages.favoriteChannel);
        }
    }

    const favoriteUnfavoriteMenuItem = isInManagedCategory ? (
        <WithTooltip
            title={
                <FormattedMessage
                    id='channelHeader.managedCategoryFavoriteDisabled'
                    defaultMessage='Channels in managed categories cannot be favorited.'
                />
            }
        >
            <div>{favoriteItem}</div>
        </WithTooltip>
    ) : favoriteItem;

    let muteUnmuteChannelMenuItem: JSX.Element | null = null;
    if (isMuted) {
        let muteChannelMessage = messages.unmuteChannel;
        if (channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL) {
            muteChannelMessage = messages.unmute;
        }
        const muteChannelText = <FormattedMessage {...muteChannelMessage}/>;
        actionLabels.push(muteChannelMessage);

        function handleUnmuteChannel() {
            unmuteChannel(currentUserId, channel.id);
        }

        muteUnmuteChannelMenuItem = (
            <Menu.Item
                id={`unmute-${channel.id}`}
                onClick={handleUnmuteChannel}
                leadingElement={<BellOffOutlineIcon size={18}/>}
                labels={muteChannelText}
            />
        );
    } else {
        let muteChannelMessage = messages.muteChannel;
        if (channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL) {
            muteChannelMessage = messages.mute;
        }
        const muteChannelText = <FormattedMessage {...muteChannelMessage}/>;
        actionLabels.push(muteChannelMessage);

        function handleMuteChannel() {
            muteChannel(currentUserId, channel.id);
        }

        muteUnmuteChannelMenuItem = (
            <Menu.Item
                id={`mute-${channel.id}`}
                onClick={handleMuteChannel}
                leadingElement={<BellOutlineIcon size={18}/>}
                labels={muteChannelText}
            />
        );
    }

    // The submenu is offered unless the channel is in a managed category, where it's shown disabled
    if (!isInManagedCategory) {
        actionLabels.push(channelMoveToSubMenuMessages.moveTo);
    }

    let copyLinkMenuItem: JSX.Element | null = null;
    if (channel.type === Constants.OPEN_CHANNEL || channel.type === Constants.PRIVATE_CHANNEL) {
        function handleCopyLink() {
            copyToClipboard(channelLink);
        }

        copyLinkMenuItem = (
            <Menu.Item
                id={`copyLink-${channel.id}`}
                onClick={handleCopyLink}
                leadingElement={<LinkVariantIcon size={18}/>}
                labels={<FormattedMessage {...messages.copyLink}/>}
            />
        );
        actionLabels.push(messages.copyLink);
    }

    let addMembersMenuItem: JSX.Element | null = null;
    if ((channel.type === Constants.PRIVATE_CHANNEL && managePrivateChannelMembers) || (channel.type === Constants.OPEN_CHANNEL && managePublicChannelMembers)) {
        function handleAddMembers() {
            openModal({
                modalId: ModalIdentifiers.CHANNEL_INVITE,
                dialogType: ChannelInviteModal,
                dialogProps: {channel},
            });
        }

        addMembersMenuItem = (
            <Menu.Item
                id={`addMembers-${channel.id}`}
                onClick={handleAddMembers}
                aria-haspopup='true'
                leadingElement={<AccountPlusOutlineIcon size={18}/>}
                labels={<FormattedMessage {...messages.addMembers}/>}
            />
        );
        actionLabels.push(messages.addMembers);
    }

    let leaveChannelMenuItem: JSX.Element | null = null;
    if (channel.name !== Constants.DEFAULT_CHANNEL) {
        const isConversation = channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL;
        const leaveChannelMessage = isConversation ? messages.leaveConversation : messages.leaveChannel;
        actionLabels.push(leaveChannelMessage);

        // Leaving a channel that asks first (a private one, or one under a policy) can't be undone by
        // rejoining it; leaving another channel can. Closing a conversation only hides it.
        let leaveRisk: 'sensitive' | 'destructive' | undefined;
        if (!isConversation && channelLeaveHandler) {
            leaveRisk = channelLeaveNeedsConfirmation ? 'destructive' : 'sensitive';
        }

        function handleLeaveChannel() {
            if (isLeaving.current || !channelLeaveHandler) {
                return;
            }

            isLeaving.current = true;

            channelLeaveHandler(() => {
                isLeaving.current = false;
            });
        }

        leaveChannelMenuItem = (
            <Menu.Item
                id={`leave-${channel.id}`}
                onClick={handleLeaveChannel}
                leadingElement={<ExitToAppIcon size={18}/>}
                labels={<FormattedMessage {...leaveChannelMessage}/>}
                isDestructive={true}
                data-agentom-id={agentomId ? `${agentomId}.leave` : undefined}
                data-agentom-risk={agentomId ? leaveRisk : undefined}
                data-agentom-confirmation={agentomId && channelLeaveNeedsConfirmation && leaveRisk ? 'required' : undefined}
            />
        );
    }

    const descriptionId = `SidebarChannelMenu-Description-${channel.id}`;

    return (
        <>
            <Menu.Container
                menuButton={{
                    id: `SidebarChannelMenu-Button-${channel.id}`,
                    class: 'SidebarMenu_menuButton',
                    'aria-label': formatMessage({
                        id: 'sidebar_left.sidebar_channel_menu.editChannel.ariaLabel',
                        defaultMessage: 'Channel options for {channelName}',
                    }, {channelName: channelLabel ?? channel.display_name}),
                    'aria-describedby': descriptionId,
                    agentomId,
                    children: <DotsVerticalIcon size={16}/>,
                }}
                menuButtonTooltip={{
                    class: 'hidden-xs',
                    text: formatMessage({id: 'sidebar_left.sidebar_channel_menu.editChannel', defaultMessage: 'Channel options'}),
                }}
                menu={{
                    id: `SidebarChannelMenu-MenuList-${channel.id}`,
                    'aria-label': formatMessage({id: 'sidebar_left.sidebar_channel_menu.dropdownAriaLabel', defaultMessage: 'Edit channel menu'}),
                    onToggle: onMenuToggle,
                }}
            >
                {showOpenInNewWindow && (
                    <MenuItemOpenInNewWindow channel={channel}/>
                )}
                {markAsReadUnreadMenuItem}
                {favoriteUnfavoriteMenuItem}
                {muteUnmuteChannelMenuItem}
                <Menu.Separator/>
                <ChannelMoveToSubmenu channel={channel}/>
                {(copyLinkMenuItem || addMembersMenuItem) && <Menu.Separator/>}
                {copyLinkMenuItem}
                {addMembersMenuItem}
                {leaveChannelMenuItem && <Menu.Separator/>}
                {leaveChannelMenuItem}
            </Menu.Container>
            <span
                id={descriptionId}
                hidden={true}
            >
                {describeActions(intl, actionLabels)}
            </span>
        </>
    );
};

export default memo(SidebarChannelMenu);
