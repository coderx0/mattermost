// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defineMessages} from 'react-intl';

// The labels of the channel header menu's items, shared by the items and by the description of the menu's
// button, which names the actions the menu offers (channel_header_menu_actions.ts)
export const channelHeaderMenuMessages = defineMessages({
    viewInfo: {
        id: 'channelHeader.viewInfo',
        defaultMessage: 'View Info',
    },
    hideInfo: {
        id: 'channelHeader.hideInfo',
        defaultMessage: 'Close Info',
    },
    muteChannel: {
        id: 'channel_header.mute',
        defaultMessage: 'Mute Channel',
    },
    unmuteChannel: {
        id: 'channel_header.unmute',
        defaultMessage: 'Unmute Channel',
    },
    muteConversation: {
        id: 'channel_header.muteConversation',
        defaultMessage: 'Mute',
    },
    unmuteConversation: {
        id: 'channel_header.unmuteConversation',
        defaultMessage: 'Unmute',
    },
    notificationPreferences: {
        id: 'navbar.preferences',
        defaultMessage: 'Notification Preferences',
    },
    channelSettings: {
        id: 'channel_header.channel_settings',
        defaultMessage: 'Channel Settings',
    },
    bookmarksBar: {
        id: 'channel_menu.bookmarks',
        defaultMessage: 'Bookmarks Bar',
    },
    enableAutotranslation: {
        id: 'channel_header.autotranslation.enable',
        defaultMessage: 'Enable autotranslation',
    },
    disableAutotranslation: {
        id: 'channel_header.autotranslation.disable',
        defaultMessage: 'Disable autotranslation',
    },
    addToFavorites: {
        id: 'channelHeader.addToFavorites',
        defaultMessage: 'Add to Favorites',
    },
    removeFromFavorites: {
        id: 'channelHeader.removeFromFavorites',
        defaultMessage: 'Remove from Favorites',
    },
    viewPinnedPosts: {
        id: 'navbar.viewPinnedPosts',
        defaultMessage: 'View Pinned Posts',
    },
    members: {
        id: 'channel_header.members',
        defaultMessage: 'Members',
    },
    addGroups: {
        id: 'navbar.addGroups',
        defaultMessage: 'Add Groups',
    },
    manageGroups: {
        id: 'navbar_dropdown.manageGroups',
        defaultMessage: 'Manage Groups',
    },
    moreActions: {
        id: 'pluginsMenu.more_actions',
        defaultMessage: 'More actions',
    },
    leaveChannel: {
        id: 'channel_header.leave',
        defaultMessage: 'Leave Channel',
    },
    closeChannel: {
        id: 'center_panel.archived.closeChannel',
        defaultMessage: 'Close Channel',
    },
    archiveChannel: {
        id: 'channel_header.delete',
        defaultMessage: 'Archive Channel',
    },
    unarchiveChannel: {
        id: 'channel_header.unarchive',
        defaultMessage: 'Unarchive Channel',
    },
});
