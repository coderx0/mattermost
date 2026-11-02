// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import styled from 'styled-components';

import Constants from 'utils/constants';
import {isKeyPressed} from 'utils/keyboard';

const Title = styled.div`
    flex:1;
    font-family: 'Open Sans', sans-serif;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
`;

const Actions = styled.div`
    button + button {
        margin-left: 8px;
    }
`;

const Button = styled.button`
    border: none;
    background: transparent;
    width: fit-content;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    &.add-members, &.manage-members-done {
        background-color: var(--button-bg);
        color: var(--button-color);
        &:hover, &:active, &:focus {
            background: linear-gradient(0deg, rgba(var(--center-channel-color-rgb), 0.16), rgba(var(--center-channel-color-rgb), 0.16)), var(--button-bg);
            color: var(--button-color);
        }
    }
    &.manage-members {
        background: rgba(var(--button-bg-rgb),0.08);
        color: var(--button-bg);
        &:hover, &:focus {
            background: rgba(var(--button-bg-rgb),0.12);
        }
        &:active {
            background: rgba(var(--button-bg-rgb),0.16);
        }
    }
`;

const ButtonIcon = styled.i`
    font-size: 14.4px;
`;

export interface Props {
    className?: string;
    channelType: string;
    membersCount: number;
    canManageMembers: boolean;
    editing: boolean;
    actions: {
        startEditing: () => void;
        stopEditing: () => void;
        inviteMembers: () => void;
    };
}

const ActionBar = ({className, channelType, membersCount, canManageMembers, editing, actions}: Props) => {
    const {formatMessage} = useIntl();
    const showManageButton = channelType !== Constants.GM_CHANNEL && membersCount > 1;

    const handleShortcut = useCallback((e: KeyboardEvent) => {
        if (isKeyPressed(e, Constants.KeyCodes.ESCAPE) && editing) {
            actions.stopEditing();
        }
    }, [editing, actions]);

    useEffect(() => {
        document.addEventListener('keydown', handleShortcut);
        return () => {
            document.removeEventListener('keydown', handleShortcut);
        };
    }, [handleShortcut]);

    return (
        <div className={className}>
            <Title>
                {editing ? (
                    <FormattedMessage
                        id='channel_members_rhs.action_bar.managing_title'
                        defaultMessage='Managing Members'
                    />
                ) : (
                    <FormattedMessage
                        id='channel_members_rhs.action_bar.members_count_title'
                        defaultMessage='{members_count} members'
                        values={{members_count: membersCount}}
                    />
                )}

            </Title>

            {canManageMembers && (
                <Actions>
                    {editing ? (
                        <Button
                            onClick={actions.stopEditing}
                            className='manage-members-done'
                            aria-describedby='channelMembersRhsManageDescription'
                            data-agentom-id='channel-members.manage'
                        >
                            <FormattedMessage
                                id='channel_members_rhs.action_bar.done_button'
                                defaultMessage='Done'
                            />
                        </Button>
                    ) : (
                        <>
                            {showManageButton && (
                                <Button
                                    className='manage-members'
                                    onClick={actions.startEditing}
                                    aria-describedby='channelMembersRhsManageDescription'
                                    data-agentom-id='channel-members.manage'
                                >
                                    <FormattedMessage
                                        id='channel_members_rhs.action_bar.manage_button'
                                        defaultMessage='Manage'
                                    />
                                </Button>
                            )}
                            <Button
                                onClick={actions.inviteMembers}
                                className='add-members'
                                aria-label={formatMessage({
                                    id: 'channel_members_rhs.action_bar.add_button.label',
                                    defaultMessage: 'Add members',
                                })}
                            >
                                <ButtonIcon
                                    className='icon-account-plus-outline'
                                    title='Add Icon'
                                    aria-hidden='true'
                                />
                                <FormattedMessage
                                    id='channel_members_rhs.action_bar.add_button'
                                    defaultMessage='Add'
                                />
                            </Button>
                        </>
                    )}
                    {(editing || showManageButton) && (
                        <span
                            id='channelMembersRhsManageDescription'
                            hidden={true}
                        >
                            {editing ? formatMessage({
                                id: 'channel_members_rhs.action_bar.done_button.description',
                                defaultMessage: "Stops managing members: hides each member's role menu",
                            }) : formatMessage({
                                id: 'channel_members_rhs.action_bar.manage_button.description',
                                defaultMessage: 'Shows a role menu beside each member, to change their role or remove them from the channel',
                            })}
                        </span>
                    )}
                </Actions>
            )}
        </div>
    );
};

export default styled(ActionBar)`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 16px 20px;
`;
