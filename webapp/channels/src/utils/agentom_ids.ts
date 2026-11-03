// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {ChannelCategory} from '@mattermost/types/channel_categories';

import {CategoryTypes} from 'mattermost-redux/constants/channel_categories';

/**
 * A name or slug as one segment of a data-agentom-id (the Agent Object Model's stable ids, written as
 * dot-separated, lowercase, kebab-case segments): lowercase, with every run of other characters (spaces,
 * dots, slashes, colons, tildes) turned into a hyphen.
 */
export function agentomIdSegment(name: string): string {
    return name.toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '');
}

/**
 * The data-agentom-id of a category: by its type for the categories every user has, by its name for one of
 * the user's own.
 */
export function getCategoryAgentomId(category: ChannelCategory) {
    const name = category.type === CategoryTypes.CUSTOM ? category.display_name : category.type;
    return `category.${agentomIdSegment(name)}`;
}

/**
 * The data-agentom-id of a post where it's shown (the controls in it add a segment: `.save`, `.menu`). A post can
 * be in the center channel and in the thread on the right at once, so where it's shown is part of the id: the
 * center channel's posts are `post.<id>`, the thread's `thread.post.<id>`, search results (and the saved and
 * pinned lists) `search.post.<id>`.
 */
export function getPostAgentomId(location: string | undefined, postId: string): string {
    const id = agentomIdSegment(postId);
    switch (location) {
    case undefined:
    case 'CENTER':
        return `post.${id}`;
    case 'RHS_ROOT':
    case 'RHS_COMMENT':
        return `thread.post.${id}`;
    case 'SEARCH':
        return `search.post.${id}`;
    default:
        return `${agentomIdSegment(location)}.post.${id}`;
    }
}
