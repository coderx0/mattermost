// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type JSX} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import type {MessageDescriptor} from 'react-intl';
import {useSelector} from 'react-redux';

import {
    PlusIcon,
    AccountPlusOutlineIcon,
    FolderPlusOutlineIcon,
    AccountMultiplePlusOutlineIcon,
    GlobeIcon,
    AccountOutlineIcon,
} from '@mattermost/compass-icons/components';

import {getCurrentTeamId} from 'mattermost-redux/selectors/entities/teams';

import {getSidebarBrowseOrAddChannelMenuPluginComponents} from 'selectors/plugins';

import * as Menu from 'components/menu';
import {moreDirectChannelsMessages} from 'components/more_direct_channels/list/list';
import {createNewCategoryMenuItemMessages} from 'components/sidebar/sidebar_category/sidebar_category_menu/create_new_category_menu_item';
import {OnboardingTourSteps} from 'components/tours';
import {useShowOnboardingTutorialStep, CreateAndJoinChannelsTour, InvitePeopleTour} from 'components/tours/onboarding_tour';

import Constants from 'utils/constants';
import {describeActions} from 'utils/popup_descriptions';

export const ELEMENT_ID_FOR_BROWSE_OR_ADD_CHANNEL_MENU = 'browserOrAddChannelMenu';
export const ELEMENT_ID_FOR_BROWSE_OR_ADD_CHANNEL_MENU_BUTTON = 'browseOrAddChannelMenuButton';

const messages = defineMessages({
    createNewChannel: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.createNewChannelMenuItem.primaryLabel',
        defaultMessage: 'Create new channel',
    },
    createNewChannelDescription: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.createNewChannelMenuItem.description',
        defaultMessage: "Asks for the channel's name, whether it's public or private, and its purpose, then creates the channel",
    },
    browseChannels: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.browseChannelsMenuItem.primaryLabel',
        defaultMessage: 'Browse channels',
    },
    browseChannelsDescription: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.browseChannelsMenuItem.description',
        defaultMessage: "Opens a list of the team's channels to search, view and join",
    },
    openDirectMessage: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.openDirectMessageMenuItem.primaryLabel',
        defaultMessage: 'Open a direct message',
    },
    createUserGroup: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.createUserGroupMenuItem.primaryLabel',
        defaultMessage: 'Create new user group',
    },
    createUserGroupDescription: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.createUserGroupMenuItem.description',
        defaultMessage: "Asks for the group's name, its mention and its members, then creates the group",
    },
    createCategory: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.createCategoryMenuItem.primaryLabel',
        defaultMessage: 'Create new category',
    },
    invitePeople: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.invitePeopleMenuItem.primaryLabel',
        defaultMessage: 'Invite people',
    },
    invitePeopleDescription: {
        id: 'sidebarLeft.browserOrCreateChannelMenu.invitePeopleMenuItem.description',
        defaultMessage: 'Asks for the people to invite, by name or email address, then invites them to the team',
    },
});

// A description that is read, not shown
function HiddenDescription({id, text}: {id: string; text: string}) {
    return (
        <span
            id={id}
            hidden={true}
        >
            {text}
        </span>
    );
}

type Props = {
    canCreateChannel: boolean;
    onCreateNewChannelClick: () => void;
    canJoinPublicChannel: boolean;
    onBrowseChannelClick: () => void;
    onOpenDirectMessageClick: () => void;
    canCreateCustomGroups: boolean;
    onCreateNewUserGroupClick: () => void;
    unreadFilterEnabled: boolean;
    onCreateNewCategoryClick: () => void;
    onInvitePeopleClick: () => void;
};

export default function SidebarBrowserOrAddChannelMenu(props: Props) {
    const intl = useIntl();
    const {formatMessage} = intl;
    const currentTeamId = useSelector(getCurrentTeamId);
    const pluginMenuItems = useSelector(getSidebarBrowseOrAddChannelMenuPluginComponents);

    const showCreateAndJoinChannelsTutorialTip = useShowOnboardingTutorialStep(OnboardingTourSteps.CREATE_AND_JOIN_CHANNELS);
    const showInvitePeopleTutorialTip = useShowOnboardingTutorialStep(OnboardingTourSteps.INVITE_PEOPLE);

    // The labels of the actions the menu offers, in its order, for the button's description. Each item but
    // the plugins' opens a dialog, described by what it asks for.
    const actionLabels: Array<MessageDescriptor | string> = [];

    let createNewChannelMenuItem: JSX.Element | null = null;
    if (props.canCreateChannel) {
        createNewChannelMenuItem = (
            <Menu.Item
                id='createNewChannelMenuItem'
                onClick={props.onCreateNewChannelClick}
                leadingElement={<PlusIcon size={18}/>}
                labels={<FormattedMessage {...messages.createNewChannel}/>}
                trailingElements={showCreateAndJoinChannelsTutorialTip && <CreateAndJoinChannelsTour/>}
                aria-haspopup='dialog'
                aria-describedby='createNewChannelMenuItem-description'
            >
                <HiddenDescription
                    id='createNewChannelMenuItem-description'
                    text={formatMessage(messages.createNewChannelDescription)}
                />
            </Menu.Item>
        );
        actionLabels.push(messages.createNewChannel);
    }

    let browseChannelsMenuItem: JSX.Element | null = null;
    if (props.canJoinPublicChannel) {
        browseChannelsMenuItem = (
            <Menu.Item
                id='browseChannelsMenuItem'
                onClick={props.onBrowseChannelClick}
                leadingElement={<GlobeIcon size={18}/>}
                labels={<FormattedMessage {...messages.browseChannels}/>}
                aria-haspopup='dialog'
                aria-describedby='browseChannelsMenuItem-description'
            >
                <HiddenDescription
                    id='browseChannelsMenuItem-description'
                    text={formatMessage(messages.browseChannelsDescription)}
                />
            </Menu.Item>
        );
        actionLabels.push(messages.browseChannels);
    }

    const createDirectMessageMenuItem = (
        <Menu.Item
            id='openDirectMessageMenuItem'
            onClick={props.onOpenDirectMessageClick}
            leadingElement={<AccountOutlineIcon size={18}/>}
            labels={<FormattedMessage {...messages.openDirectMessage}/>}
            aria-haspopup='dialog'
            aria-describedby='openDirectMessageMenuItem-description'
        >
            <HiddenDescription
                id='openDirectMessageMenuItem-description'
                text={formatMessage(moreDirectChannelsMessages.dialogDescription, {maxPeople: Constants.MAX_USERS_IN_GM - 1})}
            />
        </Menu.Item>
    );
    actionLabels.push(messages.openDirectMessage);

    let createUserGroupMenuItem: JSX.Element | null = null;
    if (props.canCreateCustomGroups) {
        createUserGroupMenuItem = (
            <Menu.Item
                id='createUserGroupMenuItem'
                onClick={props.onCreateNewUserGroupClick}
                leadingElement={<AccountMultiplePlusOutlineIcon size={18}/>}
                labels={<FormattedMessage {...messages.createUserGroup}/>}
                aria-haspopup='dialog'
                aria-describedby='createUserGroupMenuItem-description'
            >
                <HiddenDescription
                    id='createUserGroupMenuItem-description'
                    text={formatMessage(messages.createUserGroupDescription)}
                />
            </Menu.Item>
        );
        actionLabels.push(messages.createUserGroup);
    }

    let createNewCategoryMenuItem: JSX.Element | null = null;
    if (!props.unreadFilterEnabled) {
        createNewCategoryMenuItem = (
            <Menu.Item
                id='createCategoryMenuItem'
                onClick={props.onCreateNewCategoryClick}
                leadingElement={<FolderPlusOutlineIcon size={18}/>}
                labels={<FormattedMessage {...messages.createCategory}/>}
                aria-haspopup='dialog'
                aria-describedby='createCategoryMenuItem-description'
            >
                <HiddenDescription
                    id='createCategoryMenuItem-description'
                    text={formatMessage(createNewCategoryMenuItemMessages.createCategoryDescription)}
                />
            </Menu.Item>
        );
    }

    const invitePeopleMenuItem = (
        <Menu.Item
            id='invitePeopleMenuItem'
            onClick={props.onInvitePeopleClick}
            leadingElement={<AccountPlusOutlineIcon size={18}/>}
            labels={(
                <>
                    <FormattedMessage {...messages.invitePeople}/>
                    <FormattedMessage
                        id='sidebarLeft.browserOrCreateChannelMenu.invitePeopleMenuItem.secondaryLabel'
                        defaultMessage='Add people to the team'
                    />
                </>
            )}
            trailingElements={showInvitePeopleTutorialTip && <InvitePeopleTour/>}
            aria-haspopup='dialog'
            aria-describedby='invitePeopleMenuItem-description'
        >
            <HiddenDescription
                id='invitePeopleMenuItem-description'
                text={formatMessage(messages.invitePeopleDescription)}
            />
        </Menu.Item>
    );

    let pluggableMenuItems: JSX.Element[] = [];
    if (pluginMenuItems) {
        pluggableMenuItems = pluginMenuItems.map((item) => {
            const handlePluginItemClick = () => {
                if (item.action) {
                    item.action(currentTeamId);
                }
            };

            return (
                <Menu.Item
                    id={item.id + '_pluginmenuitem'}
                    key={item.id + '_pluginmenuitem'}
                    onClick={handlePluginItemClick}
                    leadingElement={item.icon}
                    labels={<span>{item.text}</span>}
                />
            );
        });
    }

    for (const item of pluginMenuItems ?? []) {
        if (typeof item.text === 'string') {
            actionLabels.push(item.text);
        }
    }
    if (createNewCategoryMenuItem) {
        actionLabels.push(messages.createCategory);
    }
    actionLabels.push(messages.invitePeople);

    const descriptionId = `${ELEMENT_ID_FOR_BROWSE_OR_ADD_CHANNEL_MENU_BUTTON}-description`;

    return (
        <>
            <Menu.Container
                menuButton={{
                    id: ELEMENT_ID_FOR_BROWSE_OR_ADD_CHANNEL_MENU_BUTTON,
                    'aria-label': formatMessage({
                        id: 'sidebarLeft.browserOrCreateChannelMenuButton.label',
                        defaultMessage: 'Browse or create channels',
                    }),
                    'aria-describedby': descriptionId,
                    agentomId: 'sidebar.browse-or-create',
                    class: 'btn btn-icon btn-sm btn-tertiary btn-inverted btn-round',
                    children: <PlusIcon size={18}/>,
                }}
                menuButtonTooltip={{
                    text: formatMessage({id: 'sidebarLeft.browserOrCreateChannelMenuButton.label', defaultMessage: 'Browse or create channels'}),
                }}
                menu={{
                    id: 'browserOrAddChannelMenu',
                    'aria-labelledby': ELEMENT_ID_FOR_BROWSE_OR_ADD_CHANNEL_MENU_BUTTON,
                }}
            >
                {createNewChannelMenuItem}
                {browseChannelsMenuItem}
                {createDirectMessageMenuItem}
                {createUserGroupMenuItem}
                {pluggableMenuItems}
                {Boolean(createNewCategoryMenuItem) &&
                    <Menu.Separator/>
                }
                {createNewCategoryMenuItem}
                <Menu.Separator/>
                {invitePeopleMenuItem}
            </Menu.Container>
            <HiddenDescription
                id={descriptionId}
                text={describeActions(intl, actionLabels)}
            />
        </>
    );
}
