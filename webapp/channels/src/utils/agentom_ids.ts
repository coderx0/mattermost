// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * A name or slug as one segment of a data-agentom-id (the Agent Object Model's stable ids, written as
 * dot-separated, lowercase, kebab-case segments): lowercase, with every run of other characters (spaces,
 * dots, slashes, colons, tildes) turned into a hyphen.
 */
export function agentomIdSegment(name: string): string {
    return name.toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '');
}
