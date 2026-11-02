// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect} from 'react';
import {useSelector} from 'react-redux';
import {useLocation} from 'react-router-dom';

import {General} from 'mattermost-redux/constants';
import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';
import {getCurrentUser, isCurrentUserSystemAdmin} from 'mattermost-redux/selectors/entities/users';

import {getIsRhsOpen, getRhsState, getSelectedPostId} from 'selectors/rhs';

import {RHSStates} from 'utils/constants';

import {appContext, screenOf, startProjection} from './projection';
import type {ChannelKind} from './projection';

/** What the right-hand panel shows, by its state. */
const PANELS: Record<string, string> = {
    [RHSStates.MENTION]: 'recent mentions',
    [RHSStates.SEARCH]: 'search results',
    [RHSStates.FLAG]: 'saved messages',
    [RHSStates.PIN]: 'pinned messages',
    [RHSStates.CHANNEL_FILES]: 'channel files',
    [RHSStates.CHANNEL_INFO]: 'channel info',
    [RHSStates.CHANNEL_MEMBERS]: 'channel members',
    [RHSStates.EDIT_HISTORY]: 'edit history',
};

const CHANNEL_TYPES: Record<string, ChannelKind | undefined> = {
    [General.OPEN_CHANNEL]: 'public',
    [General.PRIVATE_CHANNEL]: 'private',
    [General.DM_CHANNEL]: 'direct message',
    [General.GM_CHANNEL]: 'group message',
};

/**
 * Runs the app's projector and keeps its context current: the screen from the
 * route, who is signed in, the team and channel, and what the right-hand
 * panel shows (whether the page is loading comes from its API requests,
 * projection.ts). Rendered once, beside the
 * app's root, inside the store and the router; it renders nothing.
 */
export default function AgentOm() {
    const {pathname} = useLocation();
    const user = useSelector(getCurrentUser);
    const isAdmin = useSelector(isCurrentUserSystemAdmin);
    const team = useSelector(getCurrentTeam);
    const channel = useSelector(getCurrentChannel);
    const rhsOpen = useSelector(getIsRhsOpen);
    const rhsState = useSelector(getRhsState);
    const selectedPostId = useSelector(getSelectedPostId);

    useEffect(() => {
        startProjection();
    }, []);

    // Navigation and the store don't always touch the DOM, so tell the projector.
    useEffect(() => {
        appContext.screen = screenOf(pathname);
        appContext.user = user ? {username: user.username, role: isAdmin ? 'system admin' : 'member'} : undefined;
        appContext.team = team ? {name: team.name, displayName: team.display_name} : undefined;
        appContext.channel = channel ? {name: channel.name, displayName: channel.display_name, ...(CHANNEL_TYPES[channel.type] ? {type: CHANNEL_TYPES[channel.type]} : {})} : undefined;
        let panel: string | undefined;
        if (rhsOpen) {
            panel = selectedPostId ? 'thread' : PANELS[rhsState ?? ''];
        }
        appContext.panel = panel;
        window.__semanticUI?.refresh(); // eslint-disable-line no-underscore-dangle
    }, [pathname, user, isAdmin, team, channel, rhsOpen, rhsState, selectedPostId]);

    return null;
}
