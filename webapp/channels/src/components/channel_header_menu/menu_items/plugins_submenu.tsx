// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {ReactNode} from 'react';
import React, {memo} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {
    AppsIcon,
    ChevronRightIcon,
} from '@mattermost/compass-icons/components';

import * as Menu from 'components/menu';

import {channelHeaderMenuMessages} from '../channel_header_menu_messages';

type Props = {
    pluginItems: ReactNode[];
};

const PluginsSubmenu = (props: Props) => {
    const {formatMessage} = useIntl();
    if (!props.pluginItems || !props.pluginItems.length) {
        return <></>;
    }
    return (
        <Menu.SubMenu
            id={'moreActions'}
            labels={
                <FormattedMessage {...channelHeaderMenuMessages.moreActions}/>
            }
            leadingElement={<AppsIcon size='18px'/>}
            trailingElements={<ChevronRightIcon size={16}/>}
            menuId={'moreActions-menu'}
            menuAriaLabel={formatMessage(channelHeaderMenuMessages.moreActions)}
        >
            {props.pluginItems}
        </Menu.SubMenu>
    );
};

export default memo(PluginsSubmenu);
