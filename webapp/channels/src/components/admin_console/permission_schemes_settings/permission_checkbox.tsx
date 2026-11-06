// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type JSX} from 'react';

import CheckboxCheckedIcon from 'components/widgets/icons/checkbox_checked_icon';
import CheckboxPartialIcon from 'components/widgets/icons/checkbox_partial_icon';

type Props = {
    value?: string;
    id?: string;

    /** the ids of what names and describes it, and whether its row can't be changed, for assistive technology and agents */
    labelledBy?: string;
    describedBy?: string;
    readOnly?: boolean;
};

const CHECKED: Record<string, 'true' | 'mixed'> = {checked: 'true', intermediate: 'mixed'};

const PermissionCheckbox = ({value = '', id = '', labelledBy, describedBy, readOnly}: Props): JSX.Element => {
    let icon = null;
    let extraClass = '';
    if (value === 'checked') {
        icon = (
            <span data-testid='permissionCheckbox-checked'>
                <CheckboxCheckedIcon/>
            </span>
        );
        extraClass = 'checked';
    } else if (value === 'intermediate') {
        icon = <CheckboxPartialIcon/>;
        extraClass = 'intermediate';
    }
    return (
        <div
            className={'permission-check ' + extraClass}
            data-testid={id}
            {...(labelledBy ? {
                role: 'checkbox',
                'aria-checked': CHECKED[value] ?? 'false',
                'aria-labelledby': labelledBy,
                'aria-describedby': describedBy,
                'aria-disabled': readOnly ? true : undefined,
                'data-agentom-id': id || undefined,
            } : {})}
        >
            {icon}
        </div>
    );
};

export default PermissionCheckbox;
