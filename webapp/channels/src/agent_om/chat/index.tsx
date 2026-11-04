// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import InFrame from './in_frame';
import Shell from './shell';

// The dev server's chat (webpack.config.js; never in a build): a request in,
// Claude Haiku carries it out on the page, through the Agent Object Model.
//
// The top window shows the chat beside a frame that holds the app (shell.tsx):
// the app's window is then only as wide as its column, so its menus and
// dialogs fit it, as they would a narrower window, and none of the app is ever
// under the chat. The run itself goes on in the app's window, beside the
// app's projector (in_frame.tsx, runner.ts); the chat shows it from above.

export default function AgentOmChat() {
    return window.self === window.top ? <Shell/> : <InFrame/>;
}
