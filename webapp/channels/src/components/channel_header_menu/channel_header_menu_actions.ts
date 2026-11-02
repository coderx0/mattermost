// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useSelector} from 'react-redux';

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import {Permissions} from 'mattermost-redux/constants';
import {isChannelInManagedCategory} from 'mattermost-redux/selectors/entities/channel_categories';
import {isMyChannelAutotranslated, isUserLanguageSupportedForAutotranslation} from 'mattermost-redux/selectors/entities/channels';
import {haveIChannelPermission} from 'mattermost-redux/selectors/entities/roles';
import {isGuest} from 'mattermost-redux/utils/user_utils';

import {getIsRhsOpen, getRhsState} from 'selectors/rhs';
import {canAccessChannelSettings} from 'selectors/views/channel_settings';

import {getHaveIChannelBookmarkPermission} from 'components/channel_bookmarks/utils';
import {channelMoveToSubMenuMessages} from 'components/channel_move_to_sub_menu';
import {popoutMenuItemMessages} from 'components/popout_menu_item';

import {Constants, RHSStates} from 'utils/constants';
import {canPopout, isChannelPopoutWindow} from 'utils/popouts/popout_windows';
import type {PopupItemLabel} from 'utils/popup_descriptions';

import type {GlobalState} from 'types/store';

import {channelHeaderMenuMessages as messages} from './channel_header_menu_messages';

type Options = {
    user: UserProfile;
    isMuted: boolean;
    isFavorite: boolean;
    isDefault: boolean;
    isMobile: boolean;
    isLicensedForLDAPGroups: boolean;
    isChannelBookmarksEnabled: boolean;
    isChannelAutotranslated: boolean;
    pluginItemTexts: PopupItemLabel[];
    pluginItemCount: number;
};

/**
 * The labels of the actions the channel header menu offers for a public or private channel, in its order:
 * the items ChannelHeaderMenu, ChannelPublicPrivateMenu, their menu items and ChannelHeaderMobileMenu render,
 * under the same conditions. Disabled items are left out. Returns undefined for other channels (direct and
 * group messages), whose menus are built differently.
 */
export function useChannelHeaderMenuActions(channel: Channel | undefined, options: Options): PopupItemLabel[] | undefined {
    const channelId = channel?.id ?? '';
    const teamId = channel?.team_id ?? '';
    const isPrivate = channel?.type === Constants.PRIVATE_CHANNEL;

    const isRhsOpen = useSelector(getIsRhsOpen);
    const rhsState = useSelector(getRhsState);
    const canOpenChannelSettings = useSelector((state: GlobalState) => canAccessChannelSettings(state, channelId));
    const canAddBookmark = useSelector((state: GlobalState) => getHaveIChannelBookmarkPermission(state, channelId, 'add'));
    const isAutotranslated = useSelector((state: GlobalState) => isMyChannelAutotranslated(state, channelId));
    const isLanguageSupported = useSelector(isUserLanguageSupportedForAutotranslation);
    const isInManagedCategory = useSelector((state: GlobalState) => isChannelInManagedCategory(state, channelId));
    const canManageMembers = useSelector((state: GlobalState) => haveIChannelPermission(state, teamId, channelId, isPrivate ? Permissions.MANAGE_PRIVATE_CHANNEL_MEMBERS : Permissions.MANAGE_PUBLIC_CHANNEL_MEMBERS));
    const canArchive = useSelector((state: GlobalState) => haveIChannelPermission(state, teamId, channelId, isPrivate ? Permissions.DELETE_PRIVATE_CHANNEL : Permissions.DELETE_PUBLIC_CHANNEL));
    const canUnarchive = useSelector((state: GlobalState) => haveIChannelPermission(state, teamId, channelId, Permissions.MANAGE_TEAM));

    if (!channel || (channel.type !== Constants.OPEN_CHANNEL && channel.type !== Constants.PRIVATE_CHANNEL)) {
        return undefined;
    }

    const isArchived = channel.delete_at !== 0;
    const isDefault = options.isDefault;
    const labels: PopupItemLabel[] = [];

    if (canPopout() && !isChannelPopoutWindow()) {
        labels.push(popoutMenuItemMessages.openInNewWindow);
    }
    labels.push(isRhsOpen && rhsState === RHSStates.CHANNEL_INFO ? messages.hideInfo : messages.viewInfo);
    labels.push(options.isMuted ? messages.unmuteChannel : messages.muteChannel);
    if (!isArchived) {
        labels.push(messages.notificationPreferences);
        if (canOpenChannelSettings) {
            labels.push(messages.channelSettings);
        }
        if (options.isChannelBookmarksEnabled && canAddBookmark) {
            labels.push(messages.bookmarksBar);
        }
    }
    if (options.isChannelAutotranslated && isLanguageSupported) {
        labels.push(isAutotranslated ? messages.disableAutotranslation : messages.enableAutotranslation);
    }
    if (options.isMobile) {
        if (!isInManagedCategory) {
            labels.push(options.isFavorite ? messages.removeFromFavorites : messages.addToFavorites);
        }
        labels.push(messages.viewPinnedPosts);
    }
    if (!isArchived && !isDefault && canManageMembers && channel.group_constrained === true && options.isLicensedForLDAPGroups) {
        labels.push(messages.addGroups, messages.manageGroups);
    }
    labels.push(messages.members);
    if (!isInManagedCategory) {
        labels.push(channelMoveToSubMenuMessages.moveTo);
    }
    if (!options.isMobile && options.pluginItemCount > 0) {
        labels.push(messages.moreActions);
    }
    if (!isDefault && !isGuest(options.user.roles)) {
        labels.push(messages.leaveChannel);
    }
    if (isArchived) {
        labels.push(messages.closeChannel);
    }
    if (!isArchived && !isDefault && canArchive) {
        labels.push(messages.archiveChannel);
    }
    if (isArchived && !isDefault && canUnarchive) {
        labels.push(messages.unarchiveChannel);
    }
    if (options.isMobile) {
        labels.push(...options.pluginItemTexts);
    }

    return labels;
}
