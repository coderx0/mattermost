// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {JSX, MouseEvent} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {WithTooltip} from '@mattermost/shared/components/tooltip';
import type {Role} from '@mattermost/types/roles';

import {rolesRolesStrings} from './strings/roles';

type Props = {
    id: string;
    inherited?: Partial<Role>;
    selectRow: (id: string) => void;
    additionalValues?: Record<string, unknown>;
    description: string | JSX.Element;

    /** the element's id, for the permission's box to be described by it */
    elementId?: string;
};

const PermissionDescription = ({
    id,
    selectRow,
    description,
    additionalValues,
    inherited,
    elementId,
}: Props): JSX.Element => {
    const {formatMessage} = useIntl();

    const parentPermissionClicked = (e: MouseEvent) => {
        const parent = (e.target as HTMLSpanElement).parentElement;
        const isInheritLink = parent?.parentElement?.className === 'inherit-link-wrapper';
        if (parent?.className !== 'permission-description' && !isInheritLink) {
            e.stopPropagation();
        } else if (isInheritLink) {
            selectRow(id);
            e.stopPropagation();
        }
    };

    let content: string | JSX.Element = '';
    if (inherited && inherited.name) {
        const formattedName = formatMessage(rolesRolesStrings[inherited.name]);
        content = (
            <span className='inherit-link-wrapper'>
                <FormattedMessage
                    id='admin.permissions.inherited_from'
                    defaultMessage='Inherited from <link>{name}</link>.'
                    values={{
                        name: formattedName,
                        link: (text) => (
                            <a>{text}</a>
                        ),
                    }}
                />
            </span>
        );
    } else {
        content = description;
    }

    let showTooltip = true;
    if (!inherited && additionalValues) {
        showTooltip = false;
    }

    return (
        <WithTooltip
            title={content}
            disabled={!showTooltip}
        >
            <span
                id={elementId}
                className='permission-description'
                onClick={parentPermissionClicked}
            >
                {content}
            </span>
        </WithTooltip>
    );
};

export default PermissionDescription;
