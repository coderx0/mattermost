// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {type JSX} from 'react';
import {type WrappedComponentProps, defineMessages, injectIntl} from 'react-intl';
import {Link} from 'react-router-dom';

import {WithTooltip} from '@mattermost/shared/components/tooltip';
import type {Channel} from '@mattermost/types/channels';

import {mark} from 'actions/telemetry_actions';

import CustomStatusEmoji from 'components/custom_status/custom_status_emoji';
import SharedChannelIndicator from 'components/shared_channel_indicator';
import {ChannelsAndDirectMessagesTour} from 'components/tours/onboarding_tour';

import Pluggable from 'plugins/pluggable';
import {agentomIdSegment} from 'utils/agentom_ids';
import Constants, {RHSStates} from 'utils/constants';
import {wrapEmojis} from 'utils/emoji_utils';
import {cmdOrCtrlPressed} from 'utils/keyboard';
import {Mark} from 'utils/performance_telemetry';

import type {RhsState} from 'types/store/rhs';

import ChannelMentionBadge from '../channel_mention_badge';
import ChannelPencilIcon from '../channel_pencil_icon';
import SidebarChannelIcon from '../sidebar_channel_icon';
import SidebarChannelMenu from '../sidebar_channel_menu';

const messages = defineMessages({
    urgentMentionTooltip: {
        id: 'channel_mention_badge.urgent_tooltip',
        defaultMessage: 'You have an urgent mention',
    },
});

type Props = WrappedComponentProps & {
    channel: Channel;
    link: string;
    label: string;
    ariaLabelPrefix?: string;

    /**
     * The link's data-agentom-id; `channel.<channel name>` when not given
     */
    agentomId?: string;
    channelLeaveHandler?: (callback: () => void) => void;

    /**
     * Whether leaving the channel asks for confirmation first
     */
    channelLeaveNeedsConfirmation?: boolean;
    icon: JSX.Element | null;

    /**
     * Number of unread mentions in this channel
     */
    unreadMentions: number;

    /**
     * Whether or not the channel is shown as unread
     */
    isUnread: boolean;

    /**
     * Checks if the current channel is muted
     */
    isMuted: boolean;

    isChannelSelected: boolean;

    /**
     * Whether this is the channel shown
     */
    isCurrentChannel?: boolean;

    teammateId?: string;

    firstChannelName?: string;

    showChannelsTutorialStep: boolean;

    hasUrgent: boolean;
    rhsState?: RhsState;
    rhsOpen?: boolean;
    isSharedChannel?: boolean;
    remoteNames: string[];
    hasPendingJoinRequests: boolean;

    actions: {
        markMostRecentPostInChannelAsUnread: (channelId: string) => void;
        clearChannelSelection: () => void;
        multiSelectChannelTo: (channelId: string) => void;
        multiSelectChannelAdd: (channelId: string) => void;
        unsetEditingPost: () => void;
        closeRightHandSide: () => void;
        fetchChannelRemotes: (channelId: string) => void;
    };
};

type State = {
    isMenuOpen: boolean;
    isMenuFocused: boolean;
    showTooltip: boolean;
};

export class SidebarChannelLink extends React.PureComponent<Props, State> {
    labelRef: React.RefObject<HTMLDivElement | null>;

    constructor(props: Props) {
        super(props);

        this.labelRef = React.createRef();

        this.state = {
            isMenuOpen: false,
            isMenuFocused: false,
            showTooltip: false,
        };
    }

    componentDidMount(): void {
        this.enableToolTipIfNeeded();

        if (this.props.isSharedChannel && this.props.channel?.id && this.props.remoteNames.length === 0) {
            this.props.actions.fetchChannelRemotes(this.props.channel.id);
        }
    }

    componentDidUpdate(prevProps: Props): void {
        if (prevProps.label !== this.props.label) {
            this.enableToolTipIfNeeded();
        }

        if (this.props.isSharedChannel &&
            (prevProps.channel?.id !== this.props.channel?.id || prevProps.channel?.team_id !== this.props.channel?.team_id) &&
            this.props.remoteNames.length === 0 &&
            this.props.channel?.id) {
            this.props.actions.fetchChannelRemotes(this.props.channel.id);
        }
    }

    enableToolTipIfNeeded = (): void => {
        const element = this.labelRef.current;
        const showTooltip = element && element.offsetWidth < element.scrollWidth;
        this.setState({showTooltip: Boolean(showTooltip)});
    };

    getAriaLabel = (): string => {
        const {label, ariaLabelPrefix, unreadMentions, isMuted, intl} = this.props;

        let ariaLabel = label;

        if (ariaLabelPrefix) {
            ariaLabel += ` ${ariaLabelPrefix}`;
        }

        if (unreadMentions === 1) {
            ariaLabel += ` ${unreadMentions} ${intl.formatMessage({id: 'accessibility.sidebar.types.mention', defaultMessage: 'mention'})}`;
        } else if (unreadMentions > 1) {
            ariaLabel += ` ${unreadMentions} ${intl.formatMessage({id: 'accessibility.sidebar.types.mentions', defaultMessage: 'mentions'})}`;
        }

        if (this.props.hasUrgent && unreadMentions > 0) {
            ariaLabel += ` ${intl.formatMessage({id: 'accessibility.sidebar.types.urgent_mention', defaultMessage: 'including an urgent mention'})}`;
        }

        if (this.props.isUnread && unreadMentions === 0) {
            ariaLabel += ` ${intl.formatMessage({id: 'accessibility.sidebar.types.unread', defaultMessage: 'unread'})}`;
        }

        if (isMuted) {
            ariaLabel += ` ${intl.formatMessage({id: 'accessibility.sidebar.types.muted', defaultMessage: 'muted'})}`;
        }

        return ariaLabel.toLowerCase();
    };

    getAgentomId = (): string => {
        return this.props.agentomId ?? `channel.${agentomIdSegment(this.props.channel.name)}`;
    };

    handleChannelClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        mark(Mark.ChannelLinkClicked);
        this.handleSelectChannel(event);

        if (this.props.rhsOpen && this.props.rhsState === RHSStates.EDIT_HISTORY) {
            this.props.actions.closeRightHandSide();
        }
    };

    handleSelectChannel = (event: React.MouseEvent<HTMLAnchorElement>): void => {
        if (event.defaultPrevented || event.button !== 0) {
            return;
        }

        if (cmdOrCtrlPressed(event as unknown as React.KeyboardEvent)) {
            event.preventDefault();
            this.props.actions.multiSelectChannelAdd(this.props.channel.id);
        } else if (event.shiftKey) {
            event.preventDefault();
            this.props.actions.multiSelectChannelTo(this.props.channel.id);
        } else if (event.altKey && !this.props.isUnread) {
            event.preventDefault();
            this.props.actions.markMostRecentPostInChannelAsUnread(this.props.channel.id);
        } else {
            this.props.actions.clearChannelSelection();
        }
    };

    handleMenuToggle = (isMenuOpen: boolean) => {
        this.setState({isMenuOpen});
    };

    // The options button is shown on hover and while it has keyboard focus; when it's focused from the
    // keyboard, the row looks as it does on hover, so the button doesn't cover the mention badge.
    handleMenuFocus = (event: React.FocusEvent<HTMLDivElement>) => {
        let isFocusVisible = false;
        try {
            isFocusVisible = event.target.matches(':focus-visible');
        } catch {
            // A browser that doesn't know the selector shows the button over the badge instead
        }
        this.setState({isMenuFocused: isFocusVisible});
    };

    handleMenuBlur = () => {
        this.setState({isMenuFocused: false});
    };

    render(): JSX.Element {
        const {
            channel,
            icon,
            isChannelSelected,
            isMuted,
            isUnread,
            label,
            link,
            unreadMentions,
            firstChannelName,
            showChannelsTutorialStep,
            hasUrgent,
        } = this.props;

        let channelsTutorialTip: JSX.Element | null = null;

        // firstChannelName is based on channel.name,
        // but we want to display `display_name` to the user, so we check against `.name` for channel equality but pass in the .display_name value
        if (firstChannelName === channel.name || (!firstChannelName && showChannelsTutorialStep && channel.name === Constants.DEFAULT_CHANNEL)) {
            channelsTutorialTip = firstChannelName ? (<ChannelsAndDirectMessagesTour firstChannelName={channel.display_name}/>) : <ChannelsAndDirectMessagesTour/>;
        }

        let labelElement: JSX.Element = (
            <span
                ref={this.labelRef}
                className='SidebarChannelLinkLabel'
            >
                {wrapEmojis(label)}
            </span>
        );
        if (this.state.showTooltip) {
            labelElement = (
                <WithTooltip
                    title={label}
                >
                    {labelElement}
                </WithTooltip>
            );
        }

        const customStatus = this.props.teammateId ? (
            <CustomStatusEmoji
                userID={this.props.teammateId}
                showTooltip={true}
                spanStyle={{
                    height: 18,
                }}
                emojiStyle={{
                    marginTop: -4,
                    marginBottom: 0,
                    opacity: 0.8,
                }}
            />
        ) : null;

        const sharedChannelIcon = this.props.isSharedChannel ? (
            <SharedChannelIndicator
                className='icon'
                withTooltip={true}
                remoteNames={this.props.remoteNames}
            />
        ) : null;

        const content = (
            <>
                <SidebarChannelIcon
                    channel={channel}
                    icon={icon}
                />
                <div
                    className='SidebarChannelLinkLabel_wrapper'
                >
                    {labelElement}
                    {customStatus}
                    <Pluggable
                        pluggableName='SidebarChannelLinkLabel'
                        channel={this.props.channel}
                    />
                    {sharedChannelIcon}
                </div>
                <ChannelPencilIcon id={channel.id}/>
                <ChannelMentionBadge
                    unreadMentions={unreadMentions}
                    hasUrgent={hasUrgent}
                    tooltip={hasUrgent ? messages.urgentMentionTooltip : undefined}
                />
                {this.props.hasPendingJoinRequests && (
                    <span
                        className='SidebarChannelLink__join-request-dot'
                        aria-label={this.props.intl.formatMessage({
                            id: 'sidebar_channel.join_requests_pending',
                            defaultMessage: 'Pending join requests',
                        })}
                    />
                )}
            </>
        );

        // The channel's options menu is the link's sibling, not inside it: a link holds no other controls.
        // The stylesheet lays it over the end of the link, where it's shown on hover.
        const menu = (
            <div
                className={classNames(
                    'SidebarMenu',
                    'MenuWrapper',
                    {menuOpen: this.state.isMenuOpen},
                    {'MenuWrapper--open': this.state.isMenuOpen},
                )}
                onFocus={this.handleMenuFocus}
                onBlur={this.handleMenuBlur}
            >
                <SidebarChannelMenu
                    channel={channel}
                    channelLabel={label}
                    channelLink={link}
                    isUnread={isUnread}
                    channelLeaveHandler={this.props.channelLeaveHandler}
                    channelLeaveNeedsConfirmation={this.props.channelLeaveNeedsConfirmation}
                    agentomId={`${this.getAgentomId()}.options`}
                    onMenuToggle={this.handleMenuToggle}
                />
            </div>
        );

        // NOTE: class added to temporarily support the desktop app's at-mention DOM scraping of the old sidebar
        const className = classNames([
            'SidebarLink',

            // The options menu that follows the link is laid over its end; on narrow screens it's left out
            // while the mention badge shows
            'SidebarLink--withMenu',
            {
                'SidebarLink--withMentionBadge': unreadMentions > 0,
                menuOpen: this.state.isMenuOpen || this.state.isMenuFocused,
                muted: isMuted,
                'unread-title': this.props.isUnread,
                selected: isChannelSelected,
            },
        ]);
        return (
            <>
                <Link
                    className={className}
                    id={`sidebarItem_${channel.name}`}
                    aria-label={this.getAriaLabel()}
                    aria-current={this.props.isCurrentChannel ? 'page' : undefined}
                    data-agentom-id={this.getAgentomId()}
                    to={link}
                    onClick={this.handleChannelClick}
                    tabIndex={0}
                    data-testid={this.props.isUnread ? 'sidebar-unread-channel' : undefined}
                >
                    {content}
                    {channelsTutorialTip}
                </Link>
                {menu}
            </>
        );
    }
}

export default injectIntl(SidebarChannelLink);
