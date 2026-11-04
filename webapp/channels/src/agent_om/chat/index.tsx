// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

import ChatPanel, {STRIP, WIDTH} from './chat_panel';

// The dev server's chat (webpack.config.js; never in a build): a request in,
// Claude Haiku carries it out on the page, through the Agent Object Model.
//
// It sits in a column of its own at the right, beside the app and never over
// it, so the agent can reach all of the page. Mattermost lays #root out as a
// grid and puts its dialogs and menus in <body>, so the column is made at the
// body: the body is narrowed by the column's width and made the containing
// block of its fixed elements (a transform), so the app's dialogs and menus
// stay inside it; the chat is put outside the body, in <html>, outside the
// projection (data-agentom-ignore).

export default function AgentOmChat() {
    const [host] = useState(() => {
        const div = document.createElement('div');
        div.id = 'agent-om-chat';
        div.setAttribute('data-agentom-ignore', '');
        return div;
    });
    const [open, setOpen] = useState(true);

    useEffect(() => {
        document.documentElement.appendChild(host);
        return () => host.remove();
    }, [host]);

    useEffect(() => {
        const body = document.body.style;
        body.width = `calc(100% - ${open ? WIDTH : STRIP}px)`;
        body.transform = 'translate(0)';
        return () => {
            body.width = '';
            body.transform = '';
        };
    }, [open]);

    return createPortal(
        <ChatPanel
            open={open}
            setOpen={setOpen}
        />,
        host,
    );
}
