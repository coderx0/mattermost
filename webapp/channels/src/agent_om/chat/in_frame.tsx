// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-underscore-dangle -- window.__agentOmChat is where the chat above finds the runner */

import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

import {createChatRunner} from './runner';

/**
 * The chat's part in the app's own window (the frame): the runner, on
 * window.__agentOmChat for the chat above, and the address and title of the
 * page shown in the window above too, so that reloading it opens this page
 * again. Renders nothing.
 */
export default function InFrame() {
    const {pathname, search, hash} = useLocation();

    useEffect(() => {
        window.__agentOmChat ??= createChatRunner();

        const title = () => {
            window.parent.document.title = document.title;
        };
        const observer = new MutationObserver(title);
        observer.observe(document.head, {subtree: true, childList: true, characterData: true});
        title();
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        window.parent.history.replaceState(null, '', pathname + search + hash);
    }, [pathname, search, hash]);

    return null;
}
