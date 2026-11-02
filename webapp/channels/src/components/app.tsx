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

const App = () => {
    return (
        <Provider store={store}>
            <Router history={getHistory()}>
                <Root/>
                {AgentOm && (
                    <Suspense fallback={null}>
                        <AgentOm/>
                    </Suspense>
                )}
            </Router>
        </Provider>
    );
};

export default React.memo(App);
