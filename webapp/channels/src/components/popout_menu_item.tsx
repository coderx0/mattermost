// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';

import {DockWindowIcon} from '@mattermost/compass-icons/components';

import * as Menu from 'components/menu';
import type {Props as MenuItemProps} from 'components/menu/menu_item';

import {canPopout} from 'utils/popouts/popout_windows';

export type PopoutMenuItemProps = Omit<MenuItemProps, 'labels' | 'leadingElement'>;

export const popoutMenuItemMessages = defineMessages({
    openInNewWindow: {
        id: 'popout_menu_item.openInNewWindow',
        defaultMessage: 'Open in new window',
    },
});

export default function PopoutMenuItem({onClick, id = 'openInNewWindow', ...rest}: PopoutMenuItemProps) {
    if (!canPopout()) {
        return null;
    }

    return (
        <Menu.Item
            id={id}
            leadingElement={<DockWindowIcon size={18}/>}
            labels={<FormattedMessage {...popoutMenuItemMessages.openInNewWindow}/>}
            onClick={onClick}
            {...rest}
        />
    );
}
