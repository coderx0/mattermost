// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import PermissionCheckbox from 'components/admin_console/permission_schemes_settings/permission_checkbox';

import {renderWithContext, screen} from 'tests/react_testing_utils';

describe('components/admin_console/permission_schemes_settings/permission_checkbox', () => {
    test('should match snapshot on no value', () => {
        const {container} = renderWithContext(
            <PermissionCheckbox/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot on value "checked" and no id', () => {
        const {container} = renderWithContext(
            <PermissionCheckbox value='checked'/>,
        );
        expect(container).toMatchSnapshot();
    });

    test('should match snapshot on value "checked"', () => {
        const {container} = renderWithContext(
            <PermissionCheckbox
                value='checked'
                id='uniqId-checked'
            />,
        );
        expect(container).toMatchSnapshot();
        expect(screen.getByTestId('uniqId-checked')).toHaveClass('checked');
    });

    test('should match snapshot on value "intermediate"', () => {
        const {container} = renderWithContext(
            <PermissionCheckbox
                value='intermediate'
                id='uniqId-checked'
            />,
        );
        expect(container).toMatchSnapshot();
        expect(screen.getByTestId('uniqId-checked')).toHaveClass('intermediate');
    });

    test('should match snapshot on other value', () => {
        const {container} = renderWithContext(
            <PermissionCheckbox
                value='other'
                id='uniqId-checked'
            />,
        );
        expect(container).toMatchSnapshot();
        expect(screen.getByTestId('uniqId-checked')).toHaveClass('permission-check');
        expect(screen.getByTestId('uniqId-checked')).not.toHaveClass('checked');
        expect(screen.getByTestId('uniqId-checked')).not.toHaveClass('intermediate');
    });

    describe('what it says about itself', () => {
        const box = (value: string, readOnly = false) => {
            renderWithContext(
                <>
                    <span id='name'>{'Create Channels'}</span>
                    <span id='description'>{'Create new channels.'}</span>
                    <PermissionCheckbox
                        value={value}
                        id='row-checkbox'
                        labelledBy='name'
                        describedBy='description'
                        readOnly={readOnly}
                    />
                </>,
            );
            return screen.getByRole('checkbox', {name: 'Create Channels', description: 'Create new channels.'});
        };

        test.each([['checked', 'true'], ['intermediate', 'mixed'], ['', 'false']])('value "%s" is aria-checked %s', (value, checked) => {
            expect(box(value)).toHaveAttribute('aria-checked', checked);
        });

        test('says when its row can\'t be changed, and has no tab stop', () => {
            const el = box('checked', true);
            expect(el).toHaveAttribute('aria-disabled', 'true');
            expect(el).not.toHaveAttribute('tabindex');
        });

        test('has no role without a name', () => {
            renderWithContext(<PermissionCheckbox value='checked'/>);
            expect(screen.queryByRole('checkbox')).toBeNull();
        });
    });
});
