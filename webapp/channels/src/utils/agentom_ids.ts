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
