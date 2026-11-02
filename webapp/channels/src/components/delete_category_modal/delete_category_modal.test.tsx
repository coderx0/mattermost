// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {CategoryTypes} from 'mattermost-redux/constants/channel_categories';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TestHelper} from 'utils/test_helper';

import DeleteCategoryModal from './delete_category_modal';

describe('components/delete_category_modal', () => {
    test('should mark its Delete button as destructive', () => {
        renderWithContext(
            <DeleteCategoryModal
                category={TestHelper.getCategoryMock({display_name: 'Work Stuff', type: CategoryTypes.CUSTOM})}
                onExited={jest.fn()}
                actions={{deleteCategory: jest.fn()}}
            />,
        );

        const button = screen.getByRole('button', {name: 'Delete'});
        expect(button).toHaveAttribute('data-agentom-id', 'category.work-stuff.delete.confirm');
        expect(button).toHaveAttribute('data-agentom-risk', 'destructive');
    });
});
