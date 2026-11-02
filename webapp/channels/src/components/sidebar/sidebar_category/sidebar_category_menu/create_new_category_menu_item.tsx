// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import {useDispatch} from 'react-redux';

import {FolderPlusOutlineIcon} from '@mattermost/compass-icons/components';

import {openModal} from 'actions/views/modals';

import EditCategoryModal from 'components/edit_category_modal';
import * as Menu from 'components/menu';

import {ModalIdentifiers} from 'utils/constants';

type Props = {
    id: string;
};

export const createNewCategoryMenuItemMessages = defineMessages({
    createCategory: {
        id: 'sidebar_left.sidebar_category_menu.createCategory',
        defaultMessage: 'Create New Category',
    },
    createCategoryDescription: {
        id: 'sidebar_left.sidebar_category_menu.createCategory.description',
        defaultMessage: 'Asks for a name, then creates the category',
    },
});

const CreateNewCategoryMenuItem = ({
    id,
    ...otherProps
}: Props) => {
    const dispatch = useDispatch();
    const {formatMessage} = useIntl();
    const handleCreateCategory = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.EDIT_CATEGORY,
            dialogType: EditCategoryModal,
        }));
    }, [dispatch]);

    // It opens a dialog that asks for the new category's name
    const descriptionId = `create-${id}-description`;

    return (
        <Menu.Item
            id={`create-${id}`}
            onClick={handleCreateCategory}
            aria-haspopup='dialog'
            aria-describedby={descriptionId}
            leadingElement={<FolderPlusOutlineIcon size={18}/>}
            labels={<FormattedMessage {...createNewCategoryMenuItemMessages.createCategory}/>}
            {...otherProps}
        >
            <span
                id={descriptionId}
                hidden={true}
            >
                {formatMessage(createNewCategoryMenuItemMessages.createCategoryDescription)}
            </span>
        </Menu.Item>
    );
};

export default CreateNewCategoryMenuItem;
