// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo} from 'react';
import type {FC} from 'react';

import Timestamp, {RelativeRanges} from 'components/timestamp';
import BasicSeparator from 'components/widgets/separator/basic-separator';

const DATE_RANGES = [
    RelativeRanges.TODAY_TITLE_CASE,
    RelativeRanges.YESTERDAY_TITLE_CASE,
];

type Props = {
    date: number | Date;
};

const DateSeparator: FC<Props> = ({date}) => {
    return (
        <BasicSeparator>
            {/* A heading, so the day is read with the messages under it, in their place in the list */}
            <span
                role='heading'
                aria-level={2}
            >
                <Timestamp
                    value={date}
                    useTime={false}
                    useSemanticOutput={false}
                    ranges={DATE_RANGES}
                />
            </span>
        </BasicSeparator>
    );
};

export default memo(DateSeparator);
