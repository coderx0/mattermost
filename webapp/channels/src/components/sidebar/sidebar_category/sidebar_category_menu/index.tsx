// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useCallback, useMemo, type JSX} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import type {MessageDescriptor} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {
    BellOutlineIcon,
    TrashCanOutlineIcon,
    PencilOutlineIcon,
    FormatListBulletedIcon,
    SortAlphabeticalAscendingIcon,
    ClockOutlineIcon,
    ChevronRightIcon,
    CheckIcon,
} from '@mattermost/compass-icons/components';
import type {ChannelCategory} from '@mattermost/types/channel_categories';
import {CategorySorting} from '@mattermost/types/channel_categories';

import {setCategoryMuted, setCategorySorting} from 'mattermost-redux/actions/channel_categories';
import {readMultipleChannels} from 'mattermost-redux/actions/channels';
import {CategoryTypes} from 'mattermost-redux/constants/channel_categories';
import {shouldShowUnreadsCategory} from 'mattermost-redux/selectors/entities/preferences';

import {openModal} from 'actions/views/modals';
import {makeGetUnreadIdsForCategory} from 'selectors/views/channel_sidebar';

import DeleteCategoryModal from 'components/delete_category_modal';
import EditCategoryModal from 'components/edit_category_modal';
import * as Menu from 'components/menu';

import {getCategoryAgentomId} from 'utils/agentom_ids';
import {ModalIdentifiers} from 'utils/constants';
import {describeActions, describeChoices} from 'utils/popup_descriptions';

import type {GlobalState} from 'types/store';

import CreateNewCategoryMenuItem, {createNewCategoryMenuItemMessages} from './create_new_category_menu_item';
import MarkAsReadMenuItem, {markAsReadMenuItemMessages} from './mark_as_read_menu_item';
import SidebarCategoryGenericMenu from './sidebar_category_generic_menu';

type Props = {
    category: ChannelCategory;
};

const messages = defineMessages({
    unmuteCategory: {
        id: 'sidebar_left.sidebar_category_menu.unmuteCategory',
        defaultMessage: 'Unmute Category',
    },
    muteCategory: {
        id: 'sidebar_left.sidebar_category_menu.muteCategory',
        defaultMessage: 'Mute Category',
    },
    deleteCategory: {
        id: 'sidebar_left.sidebar_category_menu.deleteCategory',
        defaultMessage: 'Delete Category',
    },
    deleteCategoryDescription: {
        id: 'sidebar_left.sidebar_category_menu.deleteCategory.description',
        defaultMessage: 'Asks for confirmation, then deletes the category. Its channels move back to the Channels and Direct Messages categories; you are not removed from any channel.',
    },
    renameCategory: {
        id: 'sidebar_left.sidebar_category_menu.renameCategory',
        defaultMessage: 'Rename Category',
    },
    renameCategoryDescription: {
        id: 'sidebar_left.sidebar_category_menu.renameCategory.description',
        defaultMessage: 'Asks for a new name, then renames the category',
    },
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
    sortManually: {
        id: 'sidebar.sortedManually',
        defaultMessage: 'Manually',
    },
});

const SidebarCategoryMenu = ({
    category,
}: Props) => {
    const dispatch = useDispatch();
    const showUnreadsCategory = useSelector(shouldShowUnreadsCategory);
    const getUnreadsIdsForCategory = useMemo(() => makeGetUnreadIdsForCategory(), []);
    const unreadsIds = useSelector((state: GlobalState) => getUnreadsIdsForCategory(state, category));
    const intl = useIntl();
    const {formatMessage} = intl;

    // The labels of the actions the menu offers, in its order, for the button's description
    const actionLabels: MessageDescriptor[] = [];
    if (showUnreadsCategory === false) {
        actionLabels.push(markAsReadMenuItemMessages.viewCategory);
    }

    const agentomId = getCategoryAgentomId(category);

    let muteUnmuteCategoryMenuItem: JSX.Element | null = null;
    if (category.type !== CategoryTypes.DIRECT_MESSAGES) {
        function toggleCategoryMute() {
            dispatch(setCategoryMuted(category.id, !category.muted));
        }

        muteUnmuteCategoryMenuItem = (
            <Menu.Item
                id={`mute-${category.id}`}
                onClick={toggleCategoryMute}
                leadingElement={<BellOutlineIcon size={18}/>}
                labels={<FormattedMessage {...(category.muted ? messages.unmuteCategory : messages.muteCategory)}/>}
            />
        );
        actionLabels.push(category.muted ? messages.unmuteCategory : messages.muteCategory);
    }

    let deleteCategoryMenuItem: JSX.Element | null = null;
    let renameCategoryMenuItem: JSX.Element | null = null;
    if (category.type === CategoryTypes.CUSTOM) {
        function handleDeleteCategory() {
            dispatch(openModal({
                modalId: ModalIdentifiers.DELETE_CATEGORY,
                dialogType: DeleteCategoryModal,
                dialogProps: {
                    category,
                },
            }));
        }

        // It opens a dialog that asks to confirm the deletion
        const deleteDescriptionId = `delete-${category.id}-description`;
        deleteCategoryMenuItem = (
            <Menu.Item
                id={`delete-${category.id}`}
                isDestructive={true}
                aria-haspopup='dialog'
                aria-describedby={deleteDescriptionId}
                data-agentom-id={`${agentomId}.delete`}
                data-agentom-risk='destructive'
                data-agentom-confirmation='required'
                onClick={handleDeleteCategory}
                leadingElement={<TrashCanOutlineIcon size={18}/>}
                labels={<FormattedMessage {...messages.deleteCategory}/>}
            >
                <span
                    id={deleteDescriptionId}
                    hidden={true}
                >
                    {formatMessage(messages.deleteCategoryDescription)}
                </span>
            </Menu.Item>
        );

        function handleRenameCategory() {
            dispatch(openModal({
                modalId: ModalIdentifiers.EDIT_CATEGORY,
                dialogType: EditCategoryModal,
                dialogProps: {
                    categoryId: category.id,
                    initialCategoryName: category.display_name,
                },
            }));
        }

        // It opens a dialog that asks for the new name
        const renameDescriptionId = `rename-${category.id}-description`;
        renameCategoryMenuItem = (
            <Menu.Item
                id={`rename-${category.id}`}
                onClick={handleRenameCategory}
                aria-haspopup='dialog'
                aria-describedby={renameDescriptionId}
                leadingElement={<PencilOutlineIcon size={18}/>}
                labels={<FormattedMessage {...messages.renameCategory}/>}
            >
                <span
                    id={renameDescriptionId}
                    hidden={true}
                >
                    {formatMessage(messages.renameCategoryDescription)}
                </span>
            </Menu.Item>
        );
        actionLabels.push(messages.renameCategory, messages.deleteCategory);
    }

    function handleSortChannels(sorting: CategorySorting) {
        dispatch(setCategorySorting(category.id, sorting));
    }

    let sortChannelsSelectedValue = (
        <FormattedMessage
            id='sidebar.sortedManually'
            defaultMessage='Manually'
        />
    );
    let sortChannelsIcon = <FormatListBulletedIcon size={18}/>;
    if (category.sorting === CategorySorting.Alphabetical) {
        sortChannelsSelectedValue = (
            <FormattedMessage
                id='user.settings.sidebar.sortAlpha'
                defaultMessage='Alphabetically'
            />
        );
        sortChannelsIcon = <SortAlphabeticalAscendingIcon size={18}/>;
    } else if (category.sorting === CategorySorting.Recency) {
        sortChannelsSelectedValue = (
            <FormattedMessage
                id='user.settings.sidebar.recent'
                defaultMessage='Recent activity'
            />
        );
        sortChannelsIcon = <ClockOutlineIcon size={18}/>;
    }

    // The sort orders the submenu offers; the category's own is the checked one
    const sortChoices = [
        {id: `sortAplhabetical-${category.id}`, sorting: CategorySorting.Alphabetical, label: messages.sortAlphabetically},
        {id: `sortByMostRecent-${category.id}`, sorting: CategorySorting.Recency, label: messages.sortByRecency},
        {id: `sortManual-${category.id}`, sorting: CategorySorting.Manual, label: messages.sortManually},
    ];
    const sortChoicesId = `sortChannels-${category.id}-choices`;

    const sortChannelsMenuItem = (
        <Menu.SubMenu
            id={`sortChannels-${category.id}`}
            leadingElement={sortChannelsIcon}
            labels={<FormattedMessage {...messages.sort}/>}
            trailingElements={(
                <>
                    {sortChannelsSelectedValue}
                    <ChevronRightIcon size={16}/>
                    <span
                        id={sortChoicesId}
                        hidden={true}
                    >
                        {describeChoices(intl, sortChoices.map((choice) => choice.label))}
                    </span>
                </>
            )}
            aria-describedby={sortChoicesId}
            menuId={`sortChannels-${category.id}-menu`}
            menuAriaLabel={formatMessage({id: 'sidebar_left.sidebar_category_menu.sort.dropdownAriaLabel', defaultMessage: 'Sort submenu'})}
        >
            {sortChoices.map((choice) => (
                <Menu.Item
                    key={choice.id}
                    id={choice.id}
                    role='menuitemradio'
                    aria-checked={category.sorting === choice.sorting}
                    forceCloseOnSelect={true}
                    labels={<FormattedMessage {...choice.label}/>}
                    onClick={() => handleSortChannels(choice.sorting)}
                    trailingElements={category.sorting === choice.sorting ? <CheckIcon size={16}/> : null}
                />
            ))}
        </Menu.SubMenu>
    );
    actionLabels.push(messages.sort, createNewCategoryMenuItemMessages.createCategory);

    const handleViewCategory = useCallback(() => {
        dispatch(readMultipleChannels(unreadsIds));
    }, [dispatch, unreadsIds]);

    const markAsReadMenuItem = showUnreadsCategory === false ? (
        <MarkAsReadMenuItem
            id={category.id}
            handleViewCategory={handleViewCategory}
            numChannels={unreadsIds.length}
        />
    ) : null;

    return (
        <SidebarCategoryGenericMenu
            id={category.id}
            name={category.display_name}
            actionsDescription={describeActions(intl, actionLabels)}
            agentomId={`${agentomId}.options`}
        >
            {markAsReadMenuItem}
            {markAsReadMenuItem && <Menu.Separator/>}
            {muteUnmuteCategoryMenuItem}
            {renameCategoryMenuItem}
            {deleteCategoryMenuItem}
            <Menu.Separator/>
            {sortChannelsMenuItem}
            <Menu.Separator/>
            <CreateNewCategoryMenuItem id={category.id}/>
        </SidebarCategoryGenericMenu>
    );
};

export default memo(SidebarCategoryMenu);
