// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo} from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch} from 'react-redux';

import {LogoutVariantIcon} from '@mattermost/compass-icons/components';
import type {Channel} from '@mattermost/types/channels';

import {leaveChannel} from 'actions/views/channel';
import {openModal} from 'actions/views/modals';

import LeaveChannelModal from 'components/leave_channel_modal';
import * as Menu from 'components/menu';

import {Constants, ModalIdentifiers} from 'utils/constants';

import {channelHeaderMenuMessages} from '../channel_header_menu_messages';

// import type {PropsFromRedux} from './index';

type Props = {
    channel: Channel;
    id?: string;
};

const LeaveChannel = ({
    channel,
    id,
}: Props) => {
    const dispatch = useDispatch();

    // Leaving a private channel, or one whose membership a policy enforces, asks for confirmation first and can't be
    // undone without being added back; leaving a public channel happens at once, and it can be joined again
    const needsConfirmation = channel.type === Constants.PRIVATE_CHANNEL || Boolean(channel.policy_enforced);

    const handleLeave = () => {
        if (needsConfirmation) {
            dispatch(
                openModal({
                    modalId: ModalIdentifiers.LEAVE_PRIVATE_CHANNEL_MODAL,
                    dialogType: LeaveChannelModal,
                    dialogProps: {
                        channel,
                    },
                }),
            );
        } else {
            dispatch(leaveChannel(channel.id));
        }
    };

    return (
        <Menu.Item
            id={id}
            leadingElement={<LogoutVariantIcon size='18px'/>}
            onClick={handleLeave}
            labels={
                <FormattedMessage {...channelHeaderMenuMessages.leaveChannel}/>
            }
            isDestructive={true}
            data-agentom-id='channel-header.menu.leave'
            data-agentom-risk={needsConfirmation ? 'destructive' : 'sensitive'}
            data-agentom-confirmation={needsConfirmation ? 'required' : undefined}
        />
    );
};

export default memo(LeaveChannel);
