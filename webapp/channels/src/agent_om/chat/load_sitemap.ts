// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {SITEMAP_LINK_REL, validateSitemap} from '@agent-om/core/sitemap';
import type {SitemapNode} from '@agent-om/core/sitemap';

// Where the chat gets the app's semantic sitemap: whatever the page links to
// with <link rel="semantic-sitemap">. A page without the link, or a map that
// doesn't load or isn't valid, has none, and Claude works without it.

export async function loadSitemap(signal?: AbortSignal): Promise<SitemapNode | undefined> {
    const href = document.querySelector<HTMLLinkElement>(`link[rel="${SITEMAP_LINK_REL}"]`)?.href;
    if (!href) {
        return undefined;
    }
    try {
        const res = await fetch(href, {signal});
        if (!res.ok) {
            return undefined;
        }
        const map = (await res.json()) as SitemapNode;
        return validateSitemap(map).length ? undefined : map;
    } catch {
        return undefined;
    }
}
