// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo} from 'react';
import type {MouseEvent, KeyboardEvent} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {
    FolderOutlineIcon,
    StarOutlineIcon,
    FolderMoveOutlineIcon,
    ChevronRightIcon,
    CheckIcon,
} from '@mattermost/compass-icons/components';
import {WithTooltip} from '@mattermost/shared/components/tooltip';
import type {ChannelCategory} from '@mattermost/types/channel_categories';
import type {Channel} from '@mattermost/types/channels';

import {CategoryTypes} from 'mattermost-redux/constants/channel_categories';
import {getCategoryInTeamWithChannel, isChannelInManagedCategory} from 'mattermost-redux/selectors/entities/channel_categories';
import {getAllChannels} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

import {addChannelsInSidebar} from 'actions/views/channel_sidebar';
import {openModal} from 'actions/views/modals';
import {getNonManagedCategoriesForCurrentTeam} from 'selectors/views/channel_sidebar';

import EditCategoryModal from 'components/edit_category_modal';
import * as Menu from 'components/menu';

import Constants, {ModalIdentifiers} from 'utils/constants';
import {describeChoices} from 'utils/popup_descriptions';

import type {GlobalState} from 'types/store';

import './channel_move_to_sub_menu.scss';

type Props = {
    channel: Channel;
    inHeaderDropdown?: boolean;
};

export const channelMoveToSubMenuMessages = defineMessages({
    moveTo: {
        id: 'sidebar_left.sidebar_channel_menu.moveTo',
        defaultMessage: 'Move to...',
    },
    favorites: {
        id: 'sidebar_left.sidebar_channel_menu.favorites',
        defaultMessage: 'Favorites',
    },
    channels: {
        id: 'sidebar_left.sidebar_channel_menu.channels',
        defaultMessage: 'Channels',
    },
    moveToNewCategory: {
        id: 'sidebar_left.sidebar_channel_menu.moveToNewCategory',
        defaultMessage: 'New Category',
    },
});

const messages = channelMoveToSubMenuMessages;

const ChannelMoveToSubMenu = (props: Props) => {
    const intl = useIntl();
    const {formatMessage} = intl;

    const dispatch = useDispatch();

    const allChannels = useSelector(getAllChannels);
    const multiSelectedChannelIds = useSelector((state: GlobalState) => state.views.channelSidebar.multiSelectedChannelIds);

    const isInManagedCategory = useSelector((state: GlobalState) => {
        if (multiSelectedChannelIds.includes(props.channel.id)) {
            return multiSelectedChannelIds.some((id) => isChannelInManagedCategory(state, id));
        }
        return isChannelInManagedCategory(state, props.channel.id);
    });
    const currentTeam = useSelector(getCurrentTeam);
    const categories = useSelector((state: GlobalState) => {
        return currentTeam ? getNonManagedCategoriesForCurrentTeam(state) : undefined;
    });
    const currentCategory = useSelector((state: GlobalState) => {
        return currentTeam ? getCategoryInTeamWithChannel(state, currentTeam?.id || '', props.channel.id) : undefined;
    });

    function handleMoveToCategory(event: MouseEvent<HTMLLIElement> | KeyboardEvent<HTMLLIElement>, categoryId: string) {
        event.preventDefault();

        if (currentCategory?.id !== categoryId) {
            dispatch(addChannelsInSidebar(categoryId, props.channel.id));
        }
    }

    function handleMoveToNewCategory() {
        dispatch(openModal({
            modalId: ModalIdentifiers.EDIT_CATEGORY,
            dialogType: EditCategoryModal,
            dialogProps: {
                channelIdsToAdd: multiSelectedChannelIds.indexOf(props.channel.id) === -1 ? [props.channel.id] : multiSelectedChannelIds,
            },
        }));
    }

    function getCategoryLabel(category: ChannelCategory) {
        if (category.type === CategoryTypes.FAVORITES) {
            return messages.favorites;
        }
        if (category.type === CategoryTypes.CHANNELS) {
            return messages.channels;
        }
        return category.display_name;
    }

    function createSubmenuItemsForCategoryArray(categories: ChannelCategory[], currentCategory?: ChannelCategory) {
        const allCategories = categories.map((category: ChannelCategory) => {
            const label = getCategoryLabel(category);
            const text = typeof label === 'string' ? <span>{label}</span> : <FormattedMessage {...label}/>;

            // The category the channel is in is the checked choice
            const isCurrentCategory = Boolean(currentCategory && currentCategory.display_name === category.display_name);
            let selectedCategory = null;
            if (isCurrentCategory) {
                selectedCategory = (
                    <CheckIcon
                        color='var(--button-bg)'
                        size={18}
                    />
                );
            }

            return (
                <Menu.Item
                    id={`moveToCategory-${props.channel.id}-${category.id}`}
                    key={`moveToCategory-${props.channel.id}-${category.id}`}
                    role='menuitemradio'
                    aria-checked={isCurrentCategory}
                    forceCloseOnSelect={true}
                    leadingElement={category.type === CategoryTypes.FAVORITES ? (<StarOutlineIcon size={18}/>) : (<FolderOutlineIcon size={18}/>)}
                    labels={text}
                    trailingElements={selectedCategory}
                    onClick={(event) => handleMoveToCategory(event, category.id)}
                />
            );
        });

        const dividerAndNewCategory = [
            <Menu.Separator key='ChannelMenu-moveToDivider'/>,
            <Menu.Item
                id={`moveToNewCategory-${props.channel.id}`}
                key={`moveToNewCategory-${props.channel.id}`}
                aria-haspopup={true}
                leadingElement={<FolderMoveOutlineIcon size={18}/>}
                labels={<FormattedMessage {...messages.moveToNewCategory}/>}
                onClick={handleMoveToNewCategory}
            />,
        ];

        return [...allCategories, ...dividerAndNewCategory];
    }

    function filterCategoriesBasedOnChannelType(categories: ChannelCategory[], isDmOrGm = false) {
        if (isDmOrGm) {
            return categories.filter((category) => category.type !== CategoryTypes.CHANNELS);
        }

        return categories.filter((category) => category.type !== CategoryTypes.DIRECT_MESSAGES);
    }

    function getMoveToCategories(categories: ChannelCategory[]) {
        const isSubmenuOneOfSelectedChannels = multiSelectedChannelIds.includes(props.channel.id);

        // If sub menu is in channel header dropdown OR If multiple channels are selected but the menu is open outside of those selected channels
        if (props.inHeaderDropdown || !isSubmenuOneOfSelectedChannels) {
            const isDmOrGm = props.channel.type === Constants.DM_CHANNEL || props.channel.type === Constants.GM_CHANNEL;
            return filterCategoriesBasedOnChannelType(categories, isDmOrGm);
        }

        const areAllSelectedChannelsDMorGM = multiSelectedChannelIds.every((channelId) => allChannels[channelId].type === Constants.DM_CHANNEL || allChannels[channelId].type === Constants.GM_CHANNEL);
        if (areAllSelectedChannelsDMorGM) {
            return filterCategoriesBasedOnChannelType(categories, true);
        }

        const areAllSelectedChannelsAreNotDMorGM = multiSelectedChannelIds.every((channelId) => allChannels[channelId].type !== Constants.DM_CHANNEL && allChannels[channelId].type !== Constants.GM_CHANNEL);
        if (areAllSelectedChannelsAreNotDMorGM) {
            return filterCategoriesBasedOnChannelType(categories, false);
        }

        // If we have a mix of channel types, we need to filter out both the DM and Channel categories
        return categories.filter((category) => category.type !== CategoryTypes.CHANNELS && category.type !== CategoryTypes.DIRECT_MESSAGES);
    }

    if (!categories) {
        return null;
    }

    if (isInManagedCategory) {
        return (
            <WithTooltip
                title={
                    <FormattedMessage
                        id='sidebar_left.sidebar_channel_menu.moveTo.disabled'
                        defaultMessage="Channels in managed categories can't be moved from here. Edit the Channel Settings to change its category."
                    />
                }
            >
                <div className='ChannelMoveToSubMenu__disabledContainer'>
                    <Menu.Item
                        id={`moveTo-${props.channel.id}`}
                        labels={<FormattedMessage {...messages.moveTo}/>}
                        leadingElement={props.inHeaderDropdown ? null : <FolderMoveOutlineIcon size={18}/>}
                        trailingElements={<ChevronRightIcon size={16}/>}
                        disabled={true}
                    />
                </div>
            </WithTooltip>
        );
    }

    const moveToCategories = getMoveToCategories(categories);

    // The submenu's choices, named before it opens: the categories, then a new one
    const choicesId = `moveTo-${props.channel.id}-choices`;
    const choices = describeChoices(intl, [...moveToCategories.map(getCategoryLabel), messages.moveToNewCategory]);

    return (
        <Menu.SubMenu
            id={`moveTo-${props.channel.id}`}
            labels={<FormattedMessage {...messages.moveTo}/>}
            leadingElement={props.inHeaderDropdown ? null : <FolderMoveOutlineIcon size={18}/>}
            trailingElements={(
                <>
                    <ChevronRightIcon size={16}/>
                    <span
                        id={choicesId}
                        hidden={true}
                    >
                        {choices}
                    </span>
                </>
            )}
            aria-describedby={choicesId}
            menuId={`moveTo-${props.channel.id}-menu`}
            menuAriaLabel={formatMessage({id: 'sidebar_left.sidebar_channel_menu.moveTo.dropdownAriaLabel', defaultMessage: 'Move to submenu'})}
        >
            {createSubmenuItemsForCategoryArray(moveToCategories, currentCategory)}
        </Menu.SubMenu>
    );
};

export default memo(ChannelMoveToSubMenu);
