// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import BooleanSetting from './boolean_setting';

describe('components/admin_console/boolean_setting', () => {
    const setting = (id: string, label: string) => (
        <BooleanSetting
            id={id}
            label={label}
            value={true}
            onChange={jest.fn()}
            setByEnv={false}
            helpText=''
        />
    );

    test('names each choice by its setting, so two settings\' choices differ', () => {
        renderWithContext(
            <>
                {setting('ServiceSettings.EnableA', 'Enable A:')}
                {setting('ServiceSettings.EnableB', 'Enable B:')}
            </>,
        );

        expect(screen.getByRole('radio', {name: 'Enable A: True'})).toBeChecked();
        expect(screen.getByRole('radio', {name: 'Enable A: False'})).not.toBeChecked();
        expect(screen.getByRole('radio', {name: 'Enable B: True'})).toBeChecked();
    });

    test('shows the same words', () => {
        renderWithContext(setting('ServiceSettings.EnableA', 'Enable A:'));

        expect(screen.getByText('True')).toBeVisible();
        expect(screen.getByText('False')).toBeVisible();
    });
});
