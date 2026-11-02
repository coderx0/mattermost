// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defineMessages} from 'react-intl';
import type {IntlShape, MessageDescriptor} from 'react-intl';

// The descriptions of controls that open a popup (a menu, a list of choices, a dialog), naming what the popup
// offers before it's opened. Each caller builds its list from the same labels and conditions as the popup's
// items, so the two can't drift apart.

const messages = defineMessages({
    actions: {
        id: 'popup_description.actions',
        defaultMessage: 'Actions: {list}',
    },
    choices: {
        id: 'popup_description.choices',
        defaultMessage: 'Choices: {list}',
    },
});

export type PopupItemLabel = string | MessageDescriptor;

type Intl = Pick<IntlShape, 'formatMessage'>;

function formatLabels(intl: Intl, labels: PopupItemLabel[]): string {
    return labels.map((label) => (typeof label === 'string' ? label : intl.formatMessage(label))).join(', ');
}

/** "Actions: …": what a menu of actions offers, in the order it shows them. */
export function describeActions(intl: Intl, labels: PopupItemLabel[]): string {
    return intl.formatMessage(messages.actions, {list: formatLabels(intl, labels)});
}

/** "Choices: …": the values a control lets you pick from, in the order it shows them. */
export function describeChoices(intl: Intl, labels: PopupItemLabel[]): string {
    return intl.formatMessage(messages.choices, {list: formatLabels(intl, labels)});
}
