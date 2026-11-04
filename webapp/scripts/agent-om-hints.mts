// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Generates channels/src/agent_om/sitemap-hints.json, what each page holds (the
// sitemap's `holds`), by crawling the running app with the Agent Object
// Model's crawler (its eval/apps/harness/hints.ts), then rewrites the sitemap
// (npm run build:sitemap). The crawler follows links from each start and
// keeps, per page template, the names of parts that two of its pages both
// show. Mattermost's pages need a sign-in, so every page the crawler opens
// starts signed in, as the system admin.
//
// With the patched build running (its projector and sitemap on) and the Agent
// Object Model's driver built (`pnpm --filter @agent-om/driver build` there),
// run with the Agent Object Model's tsx, from webapp/:
//   $AGENT_OM_DIR/eval/apps/node_modules/.bin/tsx scripts/agent-om-hints.mts
// MM_URL (default http://localhost:8065), MM_TEAM (default ad-1),
// MM_USER and MM_PASSWORD (default sysadmin / Sys@dmin-sample1),
// AGENT_OM_DIR (default ../../agent-om).
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';

import type {Browser} from 'playwright';

const webapp = join(import.meta.dirname, '..');
const agentOm = process.env.AGENT_OM_DIR ?? join(webapp, '..', '..', 'agent-om');
const origin = process.env.MM_URL ?? 'http://localhost:8065';
const team = process.env.MM_TEAM ?? 'ad-1';

// a channel (the sidebar links the rest), the System Console (its menu links its pages) and the integrations
const STARTS = [`/${team}/channels/town-square`, '/admin_console/about/license', `/${team}/integrations`];
const LIMIT = 150;
const HINTS_FILE = join(webapp, 'channels', 'src', 'agent_om', 'sitemap-hints.json');

const {chromium} = createRequire(join(agentOm, 'eval', 'apps', 'package.json'))('playwright') as typeof import('playwright');
const {crawlHints} = await import(join(agentOm, 'eval', 'apps', 'harness', 'hints.ts'));

const browser = await chromium.launch();
try {
    const login = await browser.newContext();
    const page = await login.newPage();
    await page.goto(`${origin}/login`);
    await page.getByLabel('Email or Username', {exact: true}).fill(process.env.MM_USER ?? 'sysadmin');
    await page.getByLabel('Password', {exact: true}).fill(process.env.MM_PASSWORD ?? 'Sys@dmin-sample1');
    await page.getByRole('button', {name: 'Log in', exact: true}).click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));
    const storageState = await login.storageState();
    await login.close();

    const signedIn = new Proxy(browser, {
        get(target, prop) {
            if (prop === 'newContext') {
                return (options = {}) => target.newContext({...options, storageState});
            }
            const value = Reflect.get(target, prop);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    }) as Browser;

    // each start's crawl; a template found by an earlier one keeps its hints
    const hints: Record<string, string[]> = {};
    for (const start of STARTS) {
        const found: Record<string, string[]> = await crawlHints(signedIn, origin, start, LIMIT);
        for (const [template, holds] of Object.entries(found)) {
            hints[template] ??= holds;
        }
    }

    // by code point, the same on every machine
    const sorted = Object.fromEntries(Object.entries(hints).sort(([a], [b]) => (a < b ? -1 : Number(a > b))));
    writeFileSync(HINTS_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
    execFileSync('npm', ['run', 'build:sitemap'], {cwd: join(webapp, 'channels'), stdio: 'inherit'});
    console.log(`\n${HINTS_FILE}:\n${Object.entries(sorted).map(([template, holds]) => `${template} — holds: ${holds.join(', ')}`).join('\n')}`);
} finally {
    await browser.close();
}
