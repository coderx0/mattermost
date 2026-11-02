// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import fs from 'fs';
import path from 'path';

import {validateSitemap} from '@agent-om/core/sitemap';

import AdminDefinition from 'components/admin_console/admin_definition';

import {buildSitemap, CONSOLE_HIDDEN, consolePages, declaredPages, findRoutes, ROUTES, SITEMAP_FILE, sitemapJson} from './sitemap';

// The semantic sitemap is generated from the routes (sitemap.ts). This test
// fails when a route isn't declared, a declaration has no route, the map is
// invalid, or SITEMAP_FILE is behind; `npm run build:sitemap` (this test with
// AGENT_OM_WRITE_SITEMAP=1) writes it.

const channels = path.join(__dirname, '..', '..');

describe('agent_om/sitemap', () => {
    test('every route is declared, and every declaration is a route', () => {
        const routes = findRoutes(path.join(channels, 'src'));
        expect(routes.filter((r) => !(r in ROUTES))).toEqual([]);
        expect(Object.keys(ROUTES).filter((r) => !routes.includes(r))).toEqual([]);
    });

    test('the map is valid, and its file is current', () => {
        const map = buildSitemap(declaredPages(consolePages(AdminDefinition)));
        const file = path.join(channels, SITEMAP_FILE);
        if (process.env.AGENT_OM_WRITE_SITEMAP) { // eslint-disable-line no-process-env
            fs.writeFileSync(file, sitemapJson(map));
        }
        expect(validateSitemap(map)).toEqual([]);
        expect(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '').toBe(sitemapJson(map));
    });

    test("the System Console's pages left out are its pages", () => {
        const urls = Object.values(AdminDefinition).flatMap((section) => Object.values(section.subsections).map((item) => item.url));
        expect(Object.keys(CONSOLE_HIDDEN).filter((url) => !urls.includes(url))).toEqual([]);
    });

    test('puts each page under the nearest page above it', () => {
        expect(buildSitemap([{path: '/', name: 'Home'}, {path: '/{team}'}, {path: '/{team}/integrations/bots', name: 'Bots'}, {path: '/login'}])).toEqual({
            path: '/',
            name: 'Home',
            children: [{path: 'login'}, {path: '{team}', children: [{path: 'integrations/bots', name: 'Bots'}]}],
        });
    });
});
