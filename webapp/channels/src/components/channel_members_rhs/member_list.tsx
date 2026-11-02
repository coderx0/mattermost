// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {createContext, forwardRef, memo, useContext, useEffect, useMemo, useRef, useState, type JSX} from 'react';
import {useIntl} from 'react-intl';
import AutoSizer from 'react-virtualized-auto-sizer';
import {VariableSizeList} from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

import type {Channel, ChannelMembership} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import MemberListItem from './member_list_item';
import type {ItemData} from './member_list_item';

export interface ChannelMember {
    user: UserProfile;
    membership?: ChannelMembership;
    status?: string;
    displayName: string;
    remoteDisplayName?: string;
}

export enum ListItemType {
    Member = 'member',
    FirstSeparator = 'first-separator',
    Separator = 'separator',
}

export type ListItem = {
    type: ListItemType;
    data: ChannelMember | JSX.Element;
};
export interface Props {
    channel: Channel;
    members: ListItem[];
    editing: boolean;
    hasNextPage: boolean;
    isNextPageLoading: boolean;
    searchTerms: string;
    openDirectMessage: (user: UserProfile) => void;
    fetchRemoteClusterInfo: (remoteId: string, includeDeleted?: boolean, forceRefresh?: boolean) => void;
    loadMore: () => void;

    /**
     * The channel's member count, said in the list's description when it isn't narrowed by a search
     */
    membersCount?: number;
}

const DESCRIPTION_ID = 'channelMembersRhsListDescription';

// The list's name, given to the element that scrolls (react-window renders it, from outerElementType)
const ListLabelContext = createContext<string | undefined>(undefined);

// Only the rows in view are rendered, so the scrolling container is a named, focusable region: the keyboard can
// scroll it, and its description says how many members the list holds
const ListOuterElement = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const label = useContext(ListLabelContext);

    return (
        <div
            ref={ref}
            {...props}
            role='region'
            aria-label={label}
            aria-describedby={DESCRIPTION_ID}

            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the list scrolls, and only the rows in view are rendered: the keyboard reaches the rest by scrolling it
            tabIndex={0}
            data-agentom-id='channel-members.list'
        />
    );
});
ListOuterElement.displayName = 'ListOuterElement';

const MemberList = ({
    hasNextPage,
    isNextPageLoading,
    channel,
    members,
    searchTerms,
    editing,
    openDirectMessage,
    fetchRemoteClusterInfo,
    loadMore,
    membersCount,
}: Props) => {
    const {formatMessage} = useIntl();
    const infiniteLoaderRef = useRef<InfiniteLoader | null>(null);
    const variableSizeListRef = useRef<VariableSizeList | null>(null);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        if (hasMounted) {
            if (infiniteLoaderRef.current) {
                infiniteLoaderRef.current.resetloadMoreItemsCache();
            }
            if (variableSizeListRef.current) {
                variableSizeListRef.current.resetAfterIndex(0);
            }
        }
        setHasMounted(true);
    }, [searchTerms, members.length, hasMounted]);

    const itemCount = hasNextPage ? members.length + 1 : members.length;

    const loadMoreItems = isNextPageLoading ? () => {} : loadMore;

    const isItemLoaded = (index: number) => {
        return !hasNextPage || index < members.length;
    };

    const getItemSize = (index: number) => {
        if (!(index in members)) {
            return 0;
        }

        switch (members[index].type) {
        case ListItemType.FirstSeparator:
            return 28;
        case ListItemType.Separator:
            return 16 + 28;
        }

        return 48;
    };

    const totalMemberCount = useMemo(
        () => members.filter((l) => l.type === ListItemType.Member).length,
        [members],
    );

    const itemData: ItemData = useMemo(() => ({
        members,
        hasNextPage,
        channel,
        editing,
        totalMemberCount,
        openDirectMessage,
        fetchRemoteClusterInfo,
    }), [members, hasNextPage, channel, editing, totalMemberCount, openDirectMessage, fetchRemoteClusterInfo]);

    if (members.length === 0) {
        return null;
    }

    let description;
    if (searchTerms) {
        description = formatMessage({
            id: 'channel_members_rhs.list.search_description',
            defaultMessage: '{count, number} {count, plural, one {member matches} other {members match}} “{terms}”',
        }, {count: totalMemberCount, terms: searchTerms});
    } else {
        description = formatMessage({
            id: 'channel_members_rhs.list.description',
            defaultMessage: '{count, number} {count, plural, one {member} other {members}}, channel admins first, each group by name; more load as you scroll',
        }, {count: membersCount ?? totalMemberCount});
    }

    return (
        <ListLabelContext.Provider value={formatMessage({id: 'channel_members_rhs.list.label', defaultMessage: 'Channel members'})}>
            <span
                id={DESCRIPTION_ID}
                hidden={true}
            >
                {description}
            </span>
            <AutoSizer>
                {({height, width}) => (
                    <InfiniteLoader
                        ref={infiniteLoaderRef}
                        isItemLoaded={isItemLoaded}
                        itemCount={itemCount}
                        loadMoreItems={loadMoreItems}
                    >
                        {({onItemsRendered, ref}) => (

                            <VariableSizeList
                                itemCount={itemCount}
                                onItemsRendered={onItemsRendered}
                                ref={(list) => {
                                    ref(list);
                                    variableSizeListRef.current = list;
                                }}
                                itemData={itemData}
                                itemSize={getItemSize}
                                height={height}
                                width={width}
                                outerElementType={ListOuterElement}
                            >
                                {MemberListItem}
                            </VariableSizeList>
                        )}
                    </InfiniteLoader>
                )}
            </AutoSizer>
        </ListLabelContext.Provider>
    );
};

export default memo(MemberList);
