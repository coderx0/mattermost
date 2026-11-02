// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {memo, useState} from 'react';
import {useIntl} from 'react-intl';

import {
    DotsVerticalIcon,
} from '@mattermost/compass-icons/components';

import * as Menu from 'components/menu';

type Props = {
    id: string;
    children: React.ReactNode[];
    name: string;

    /**
     * What the menu offers ("Actions: …"), given to its button as its description
     */
    actionsDescription?: string;

    /**
     * The menu button's data-agentom-id
     */
    agentomId?: string;
};

const SidebarCategoryGenericMenu = ({
    id,
    children,
    name,
    actionsDescription,
    agentomId,
}: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const {formatMessage} = useIntl();

    function handleMenuToggle(isOpen: boolean) {
        setIsMenuOpen(isOpen);
    }

    const descriptionId = `SidebarCategoryMenu-Description-${id}`;

    return (
        <div
            className={classNames(
                'SidebarMenu',
                'MenuWrapper',
                {
                    'MenuWrapper--open': isMenuOpen,
                    menuOpen: isMenuOpen,
                },
            )}
        >
            <Menu.Container
                menuButton={{
                    id: `SidebarCategoryMenu-Button-${id}`,
                    'aria-label': formatMessage({id: 'sidebar_left.sidebar_category_menu.editCategory', defaultMessage: '{name} category options'}, {name}),
                    'aria-describedby': actionsDescription ? descriptionId : undefined,
                    agentomId,
                    class: 'SidebarMenu_menuButton',
                    children: <DotsVerticalIcon size={16}/>,
                }}
                menuButtonTooltip={{
                    text: formatMessage({id: 'sidebar_left.sidebar_category_menu.editCategory', defaultMessage: '{name} category options'}, {name}),
                    class: 'hidden-xs',
                }}
                menu={{
                    id: `SidebarChannelMenu-MenuList-${id}`,
                    'aria-label': formatMessage({id: 'sidebar_left.sidebar_category_menu.dropdownAriaLabel', defaultMessage: 'Edit category menu'}),
                    onToggle: handleMenuToggle,
                }}
            >
                {children}
            </Menu.Container>
            {actionsDescription && (
                <span
                    id={descriptionId}
                    hidden={true}
                >
                    {actionsDescription}
                </span>
            )}
        </div>
    );
};

export default memo(SidebarCategoryGenericMenu);
