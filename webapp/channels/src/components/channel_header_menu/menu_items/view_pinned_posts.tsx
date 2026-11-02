// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo} from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {closeRightHandSide, showPinnedPosts} from 'actions/views/rhs';
import {getRhsState} from 'selectors/rhs';

import * as Menu from 'components/menu';

import {RHSStates} from 'utils/constants';

import {channelHeaderMenuMessages} from '../channel_header_menu_messages';

type Props = {
    channelID: string;
};

const ViewPinnedPosts = ({
    channelID,
}: Props) => {
    const dispatch = useDispatch();
    const rhsState = useSelector(getRhsState);
    const hasPinnedPosts = rhsState === RHSStates.PIN;

    const handleClick = () => {
        if (hasPinnedPosts) {
            dispatch(closeRightHandSide());
        } else {
            dispatch(showPinnedPosts(channelID));
        }
    };

    return (
        <Menu.Item
            onClick={handleClick}
            labels={
                <FormattedMessage {...channelHeaderMenuMessages.viewPinnedPosts}/>
            }
        />
    );
};

export default memo(ViewPinnedPosts);
