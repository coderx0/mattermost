// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-underscore-dangle -- window.__agentOmChat is where the app's window keeps the runner */

import React, {useCallback, useEffect, useRef, useState} from 'react';

import ChatPanel from './chat_panel';
import {IDLE} from './runner';
import type {ChatRunner, ChatView} from './runner';

/** The run, as the chat in the top window sees it: the runner in the app's window, read through the frame. */
function useRunner(frame: React.RefObject<HTMLIFrameElement | null>) {
    const [view, setView] = useState<ChatView>(IDLE);
    const runner = useCallback((): ChatRunner | undefined => frame.current?.contentWindow?.__agentOmChat, [frame]);

    useEffect(() => {
        const iframe = frame.current;
        if (!iframe) {
            return undefined;
        }
        let unsubscribe: (() => void) | undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;

        // the runner is there once the app has loaded the chat's part
        const attach = () => {
            const r = runner();
            if (!r) {
                timer = setTimeout(attach, 250);
                return;
            }

            // a new page's idle runner leaves the last run's outcome shown
            setView((last) => (r.view().status === 'idle' ? last : r.view()));
            unsubscribe = r.subscribe(setView);
        };

        // a page loaded in the frame: the runner of the page before is gone, and with it a run under way
        const onLoad = () => {
            unsubscribe = undefined;
            clearTimeout(timer);
            setView((last) => (last.status === 'running' ? {...last, status: 'failed', thinking: false, confirm: undefined, secret: undefined, message: 'The page loaded again, which ended the run.'} : last));
            attach();
        };
        iframe.addEventListener('load', onLoad);
        return () => {
            iframe.removeEventListener('load', onLoad);
            clearTimeout(timer);
            unsubscribe?.();
        };
    }, [frame, runner]);

    return {
        view,
        start: (query: string) => {
            const r = runner();
            if (r) {
                r.start(query);
            } else {
                setView({...IDLE, status: 'failed', query, message: 'The app is still loading.'});
            }
        },
        stop: () => runner()?.stop(),
        clear: () => {
            runner()?.clear();
            setView(IDLE);
        },
        respond: (ok: boolean) => runner()?.respond(ok),
        enterSecret: (value: string | null) => runner()?.enterSecret(value),
        whatClaudeSees: async () => (await runner()?.whatClaudeSees()) ?? 'The app is still loading.',
    };
}

/** The top window: the app in a frame, and the chat beside it. */
export default function Shell() {
    const frame = useRef<HTMLIFrameElement>(null);

    // the frame opens the page this window was opened at
    const [src] = useState(() => window.location.pathname + window.location.search + window.location.hash);
    const [open, setOpen] = useState(true);
    const run = useRunner(frame);

    return (

        // over the app's loading screen, which this window never takes down
        <div style={{position: 'fixed', inset: 0, display: 'flex', zIndex: 2147483647, background: '#fff'}}>
            <iframe
                ref={frame}
                src={src}
                title='Mattermost'
                style={{flex: 1, minWidth: 0, height: '100%', border: 0}}
            />
            <ChatPanel
                open={open}
                setOpen={setOpen}
                {...run}
            />
        </div>
    );
}
