// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {lazy, Suspense} from 'react';
import {Provider} from 'react-redux';
import {Router} from 'react-router-dom';

import store from 'stores/redux_store';

import {makeAsyncComponent} from 'components/async_load';

import {getHistory} from 'utils/browser_history';
const LazyRoot = lazy(() => import('components/root'));

const Root = makeAsyncComponent('Root', LazyRoot);

// The Agent Object Model's projector (agent_om/); a build with AGENT_OM=off leaves it out.
const AgentOm = process.env.AGENT_OM === 'off' ? null : lazy(() => import('agent_om/agent_om')); // eslint-disable-line no-process-env

// The Agent Object Model's chat, which runs Claude on the page (agent_om/chat/): in the dev server only, never in a build.
// The top window then shows the chat beside the app, which it opens in a frame of its own.
const AgentOmChat = process.env.AGENT_OM_CHAT === 'on' ? lazy(() => import('agent_om/chat')) : null; // eslint-disable-line no-process-env
const chatAbove = AgentOmChat !== null && window.self === window.top;

const App = () => {
    if (chatAbove) {
        return (
            <Suspense fallback={null}>
                <AgentOmChat/>
            </Suspense>
        );
    }
    return (
        <Provider store={store}>
            <Router history={getHistory()}>
                <Root/>
                {AgentOm && (
                    <Suspense fallback={null}>
                        <AgentOm/>
                    </Suspense>
                )}
                {AgentOmChat && (
                    <Suspense fallback={null}>
                        <AgentOmChat/>
                    </Suspense>
                )}
            </Router>
        </Provider>
    );
};

export default React.memo(App);
