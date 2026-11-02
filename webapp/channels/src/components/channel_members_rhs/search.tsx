// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import styled from 'styled-components';

import Input from 'components/widgets/inputs/input/input';

interface Props {
    className?: string;
    terms: string;
    onInput: (terms: string) => void;
}

// The description says how the list is narrowed, as index.ts does it: searchActiveProfilesInCurrentChannel (mattermost-redux
// selectors/entities/users), which keeps active users matched by filterProfilesMatchingWithTerm and
// nameSuggestionsForUser (mattermost-redux utils/user_utils) on the trimmed text
const SearchBar = ({className, terms, onInput}: Props) => {
    const {formatMessage} = useIntl();

    let inputSuffix;
    if (terms.length > 0) {
        inputSuffix = (
            <button
                className='style--none'
                onClick={() => onInput('')}
                aria-label={formatMessage({
                    id: 'channel_members_rhs.search_bar.aria.cancel_search_button',
                    defaultMessage: 'cancel members search',
                })}
            >
                <i
                    className={'icon icon-close-circle'}
                    aria-hidden='true'
                />
            </button>
        );
    }

    return (
        <div className={className}>
            <Input
                data-testid='channel-member-rhs-search'
                value={terms}
                onInput={(e) => onInput(e.currentTarget.value)}
                inputPrefix={<i className={'icon icon-magnify'}/>}
                inputSuffix={inputSuffix}
                placeholder={formatMessage({
                    id: 'channel_members_rhs.search_bar.placeholder',
                    defaultMessage: 'Search members',
                })}
                useLegend={false}
                aria-describedby='channelMembersRhsSearchDescription'
            />
            <span
                id='channelMembersRhsSearchDescription'
                hidden={true}
            >
                <FormattedMessage
                    id='channel_members_rhs.search_bar.description'
                    defaultMessage="Shows the channel's members, other than deactivated users, whose username, first name, last name, full name, nickname, position or email address before the @ contains the text you type as one piece, ignoring case and a leading @. With an @ in the text, whole email addresses are searched too. Results update as you type."
                />
            </span>
        </div>
    );
};

export default styled(SearchBar)`
    display: flex;
    padding: 0px 20px 12px;

    .Input_container .Input_wrapper {
        padding: 0 8px;
    }
`;
