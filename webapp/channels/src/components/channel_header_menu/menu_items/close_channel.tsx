// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type JSX} from 'react';
import {FormattedMessage} from 'react-intl';

import {goToLastViewedChannel} from 'actions/views/channel';

import * as Menu from 'components/menu';

import {channelHeaderMenuMessages} from '../channel_header_menu_messages';

interface Props extends Menu.FirstMenuItemProps {}

const CloseChannel = ({...rest}: Props): JSX.Element => {
    return (
        <Menu.Item
            onClick={goToLastViewedChannel}
            labels={
                <FormattedMessage {...channelHeaderMenuMessages.closeChannel}/>}
            {...rest}
        />
    );
};
export default React.memo(CloseChannel);
