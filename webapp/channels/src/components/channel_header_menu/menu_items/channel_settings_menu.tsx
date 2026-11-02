// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, type JSX} from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {
    CogOutlineIcon,
} from '@mattermost/compass-icons/components';
import type {Channel} from '@mattermost/types/channels';

import {openModal} from 'actions/views/modals';
import {canAccessChannelSettings} from 'selectors/views/channel_settings';

import ChannelSettingsModal from 'components/channel_settings_modal/channel_settings_modal';
import * as Menu from 'components/menu';

import {Constants, ModalIdentifiers} from 'utils/constants';

import type {GlobalState} from 'types/store';

import {channelHeaderMenuMessages} from '../channel_header_menu_messages';

type Props = {
    channel: Channel;
};

const messages = defineMessages({
    channelDescription: {
        id: 'channel_header.channel_settings.description',
        defaultMessage: "Opens the channel's settings, in a tab for each part you can change, such as its name, URL, type, purpose and header, its configuration, and archiving it",
    },
    conversationDescription: {
        id: 'channel_header.channel_settings.conversation_description',
        defaultMessage: "Opens the conversation's settings",
    },
});

const ChannelSettingsMenu = ({channel}: Props): JSX.Element | null => {
    const dispatch = useDispatch();
    const canAccess = useSelector((state: GlobalState) => canAccessChannelSettings(state, channel.id));

    // Don't render the menu item if the user doesn't have access to any channel settings tab
    if (!canAccess) {
        return null;
    }

    const handleOpenChannelSettings = () => {
        dispatch(
            openModal({
                modalId: ModalIdentifiers.CHANNEL_SETTINGS,
                dialogType: ChannelSettingsModal,
                dialogProps: {
                    channelId: channel.id,
                    focusOriginElement: 'channelHeaderDropdownButton',
                    isOpen: true,
                },
            }),
        );
    };

    const isConversation = channel.type === Constants.DM_CHANNEL || channel.type === Constants.GM_CHANNEL;

    return (
        <Menu.Item
            id={'channelSettings'}
            labels={
                <FormattedMessage {...channelHeaderMenuMessages.channelSettings}/>
            }
            onClick={handleOpenChannelSettings}
            leadingElement={<CogOutlineIcon size={18}/>}
            aria-haspopup='dialog'
            aria-describedby='channelSettings-description'
        >
            <span
                id='channelSettings-description'
                hidden={true}
            >
                <FormattedMessage {...(isConversation ? messages.conversationDescription : messages.channelDescription)}/>
            </span>
        </Menu.Item>
    );
};

export default memo(ChannelSettingsMenu);
