// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {memo, useState} from 'react';
import type {MouseEvent, KeyboardEvent} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {
    SortAlphabeticalAscendingIcon,
    ClockOutlineIcon,
    AccountMultipleOutlineIcon,
    AccountPlusOutlineIcon,
    DotsVerticalIcon,
    ChevronRightIcon,
    CheckIcon,
} from '@mattermost/compass-icons/components';
import type {ChannelCategory} from '@mattermost/types/channel_categories';
import {CategorySorting} from '@mattermost/types/channel_categories';

import {setCategorySorting} from 'mattermost-redux/actions/channel_categories';
import {savePreferences} from 'mattermost-redux/actions/preferences';
import {Preferences} from 'mattermost-redux/constants';
import {getVisibleDmGmLimit} from 'mattermost-redux/selectors/entities/preferences';
import {getCurrentUserId} from 'mattermost-redux/selectors/entities/users';

import * as Menu from 'components/menu';

import {getCategoryAgentomId} from 'utils/agentom_ids';
import Constants from 'utils/constants';
import {describeActions, describeChoices} from 'utils/popup_descriptions';

const messages = defineMessages({
    sort: {
        id: 'sidebar.sort',
        defaultMessage: 'Sort',
    },
    sortAlphabetically: {
        id: 'user.settings.sidebar.sortAlpha',
        defaultMessage: 'Alphabetically',
    },
    sortByRecency: {
        id: 'sidebar.sortedByRecencyLabel',
        defaultMessage: 'Recent activity',
    },
    show: {
        id: 'sidebar.show',
        defaultMessage: 'Show',
    },
    showAll: {
        id: 'channel_notifications.levels.all',
        defaultMessage: 'All',
    },
    openDirectMessage: {
        id: 'sidebar.openDirectMessage',
        defaultMessage: 'Open a direct message',
    },
});

type Props = {
    category: ChannelCategory;
    handleOpenDirectMessagesModal: (e: MouseEvent<HTMLLIElement> | KeyboardEvent<HTMLLIElement>) => void;
};

const SidebarCategorySortingMenu = ({
    category,
    handleOpenDirectMessagesModal,
}: Props) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const intl = useIntl();
    const {formatMessage} = intl;

    const dispatch = useDispatch();
    const selectedDmNumber = useSelector(getVisibleDmGmLimit);
    const currentUserId = useSelector(getCurrentUserId);

    function handleSortDirectMessages(sorting: CategorySorting) {
        dispatch(setCategorySorting(category.id, sorting));
    }

    let sortDirectMessagesIcon = <ClockOutlineIcon size={18}/>;
    let sortDirectMessagesSelectedValue = (
        <FormattedMessage
            id='user.settings.sidebar.recent'
            defaultMessage='Recent activity'
        />
    );
    if (category.sorting === CategorySorting.Alphabetical) {
        sortDirectMessagesSelectedValue = (
            <FormattedMessage
                id='user.settings.sidebar.sortAlpha'
                defaultMessage='Alphabetically'
            />
        );
        sortDirectMessagesIcon = <SortAlphabeticalAscendingIcon size={18}/>;
    }

    // The sort orders the submenu offers; the category's own is the checked one
    const sortChoices = [
        {id: `sortAlphabetical-${category.id}`, sorting: CategorySorting.Alphabetical, label: messages.sortAlphabetically},
        {id: `sortByMostRecent-${category.id}`, sorting: CategorySorting.Recency, label: messages.sortByRecency},
    ];
    const sortChoicesId = `sortDirectMessages-${category.id}-choices`;

    const sortDirectMessagesMenuItem = (
        <Menu.SubMenu
            id={`sortDirectMessages-${category.id}`}
            leadingElement={sortDirectMessagesIcon}
            labels={<FormattedMessage {...messages.sort}/>}
            trailingElements={
                <>
                    {sortDirectMessagesSelectedValue}
                    <ChevronRightIcon size={16}/>
                    <span
                        id={sortChoicesId}
                        hidden={true}
                    >
                        {describeChoices(intl, sortChoices.map((choice) => choice.label))}
                    </span>
                </>
            }
            aria-describedby={sortChoicesId}
            menuId={`sortDirectMessages-${category.id}-menu`}
        >
            {sortChoices.map((choice) => (
                <Menu.Item
                    key={choice.id}
                    id={choice.id}
                    role='menuitemradio'
                    aria-checked={category.sorting === choice.sorting}
                    forceCloseOnSelect={true}
                    clickAfterClose={true}
                    labels={<FormattedMessage {...choice.label}/>}
                    onClick={() => handleSortDirectMessages(choice.sorting)}
                    trailingElements={category.sorting === choice.sorting ? <CheckIcon size={16}/> : null}
                />
            ))}
        </Menu.SubMenu>

    );

    function handlelimitVisibleDMsGMs(number: number) {
        dispatch(savePreferences(currentUserId, [{
            user_id: currentUserId,
            category: Constants.Preferences.CATEGORY_SIDEBAR_SETTINGS,
            name: Preferences.LIMIT_VISIBLE_DMS_GMS,
            value: number.toString(),
        }]));
    }

    let showMessagesCountSelectedValue = <span>{selectedDmNumber}</span>;
    if (selectedDmNumber === 10000) {
        showMessagesCountSelectedValue = <FormattedMessage {...messages.showAll}/>;
    }
    const showChoicesId = `showMessagesCount-${category.id}-choices`;

    const showMessagesCountMenuItem = (
        <Menu.SubMenu
            id={`showMessagesCount-${category.id}`}
            leadingElement={<AccountMultipleOutlineIcon size={18}/>}
            labels={<FormattedMessage {...messages.show}/>}
            trailingElements={(
                <>
                    {showMessagesCountSelectedValue}
                    <ChevronRightIcon size={16}/>
                    <span
                        id={showChoicesId}
                        hidden={true}
                    >
                        {describeChoices(intl, Constants.DM_AND_GM_SHOW_COUNTS.map((dmGmShowCount) => String(dmGmShowCount)))}
                    </span>
                </>
            )}
            aria-describedby={showChoicesId}
            menuId={`showMessagesCount-${category.id}-menu`}
        >
            {Constants.DM_AND_GM_SHOW_COUNTS.map((dmGmShowCount) => (
                <Menu.Item
                    id={`showDmCount-${category.id}-${dmGmShowCount}`}
                    key={`showDmCount-${category.id}-${dmGmShowCount}`}
                    role='menuitemradio'
                    aria-checked={selectedDmNumber === dmGmShowCount}
                    forceCloseOnSelect={true}
                    clickAfterClose={true}
                    labels={<span>{dmGmShowCount}</span>}
                    onClick={() => handlelimitVisibleDMsGMs(dmGmShowCount)}
                    trailingElements={selectedDmNumber === dmGmShowCount ? <CheckIcon size={16}/> : null}
                />
            ))}
        </Menu.SubMenu>

    );

    const openDirectMessageMenuItem = (
        <Menu.Item
            id={`openDirectMessage-${category.id}`}
            onClick={handleOpenDirectMessagesModal}
            leadingElement={<AccountPlusOutlineIcon size={18}/>}
            labels={<FormattedMessage {...messages.openDirectMessage}/>}
        />
    );

    const descriptionId = `SidebarCategorySortingMenu-Description-${category.id}`;
    const agentomId = `${getCategoryAgentomId(category)}.options`;

    function handleMenuToggle(isOpen: boolean) {
        setIsMenuOpen(isOpen);
    }

    return (
        <div
            className={classNames(
                'SidebarMenu',
                'MenuWrapper',
                {menuOpen: isMenuOpen},
                {'MenuWrapper--open': isMenuOpen},
            )}
        >
            <Menu.Container
                menuButton={{
                    id: `SidebarCategorySortingMenu-Button-${category.id}`,
                    'aria-label': formatMessage({id: 'sidebar_left.sidebar_category_menu.editCategory', defaultMessage: '{name} category options'}, {name: category.display_name}),
                    'aria-describedby': descriptionId,
                    agentomId,
                    class: 'SidebarMenu_menuButton sortingMenu',
                    children: <DotsVerticalIcon size={16}/>,
                }}
                menuButtonTooltip={{
                    text: formatMessage({id: 'sidebar_left.sidebar_category_menu.editCategory', defaultMessage: '{name} category options'}, {name: category.display_name}),
                    class: 'hidden-xs',
                }}
                menu={{
                    id: `SidebarCategorySortingMenu-MenuList-${category.id}`,
                    'aria-label': formatMessage({id: 'sidebar_left.sidebar_category_menu.dropdownAriaLabel', defaultMessage: 'Edit category menu'}),
                    onToggle: handleMenuToggle,
                }}
            >
                {sortDirectMessagesMenuItem}
                {showMessagesCountMenuItem}
                <Menu.Separator/>
                {openDirectMessageMenuItem}
            </Menu.Container>
            <span
                id={descriptionId}
                hidden={true}
            >
                {describeActions(intl, [messages.sort, messages.show, messages.openDirectMessage])}
            </span>
        </div>
    );
};

export default memo(SidebarCategorySortingMenu);
