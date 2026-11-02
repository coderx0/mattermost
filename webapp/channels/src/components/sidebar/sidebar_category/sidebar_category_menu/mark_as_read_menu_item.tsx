// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {FormattedMessage, defineMessages, useIntl} from 'react-intl';
import {useDispatch} from 'react-redux';

import {MarkAsUnreadIcon} from '@mattermost/compass-icons/components';

import {openModal} from 'actions/views/modals';

import * as Menu from 'components/menu';

import {ModalIdentifiers} from 'utils/constants';

import MarkAsReadConfirmModal from './mark_as_read_confirm_modal';

type Props = {
    id: string;
    handleViewCategory: () => void;
    numChannels: number;
};

export const markAsReadMenuItemMessages = defineMessages({
    viewCategory: {
        id: 'sidebar_left.sidebar_category_menu.viewCategory',
        defaultMessage: 'Mark category as read',
    },
    viewCategoryDescription: {
        id: 'sidebar_left.sidebar_category_menu.viewCategory.description',
        defaultMessage: 'Asks for confirmation, then marks the {numChannels} channels as read',
    },
});

const MarkAsUnreadItem = ({
    id,
    handleViewCategory,
    numChannels,
    ...otherProps
}: Props) => {
    const dispatch = useDispatch();
    const {formatMessage} = useIntl();

    const onClick = useCallback(() => {
        if (numChannels <= 0) {
            return;
        }

        if (numChannels === 1) {
            handleViewCategory();
            return;
        }

        dispatch(openModal({
            modalId: ModalIdentifiers.DELETE_CATEGORY,
            dialogType: MarkAsReadConfirmModal,
            dialogProps: {
                handleConfirm: handleViewCategory,
                numChannels,
            },
        }));
    }, [dispatch, handleViewCategory, numChannels]);

    // With more than one channel to mark, it opens a dialog that asks to confirm
    const asksToConfirm = numChannels > 1;
    const descriptionId = `view-${id}-description`;

    return (
        <Menu.Item
            id={`view-${id}`}
            onClick={onClick}
            aria-haspopup={asksToConfirm ? 'dialog' : undefined}
            aria-describedby={asksToConfirm ? descriptionId : undefined}
            leadingElement={<MarkAsUnreadIcon size={18}/>}
            labels={<FormattedMessage {...markAsReadMenuItemMessages.viewCategory}/>}
            {...otherProps}
        >
            {asksToConfirm && (
                <span
                    id={descriptionId}
                    hidden={true}
                >
                    {formatMessage(markAsReadMenuItemMessages.viewCategoryDescription, {numChannels})}
                </span>
            )}
        </Menu.Item>
    );
};

export default MarkAsUnreadItem;
