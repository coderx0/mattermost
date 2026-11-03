// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useId} from 'react';
import type {ReactNode, MouseEventHandler} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {WithTooltip} from '@mattermost/shared/components/tooltip';

import CloseIcon from 'components/widgets/icons/close_icon';
import UnreadAboveIcon from 'components/widgets/icons/unread_above_icon';
import UnreadBelowIcon from 'components/widgets/icons/unread_below_icon';

import Constants from 'utils/constants';

import './toast.scss';

export type Props = {
    onClick?: MouseEventHandler<HTMLDivElement>;
    onClickMessage?: ReactNode;
    onDismiss?: () => void;
    children?: ReactNode;
    show: boolean;
    showActions?: boolean; //used for showing jump actions
    width: number;
    extraClasses?: string;
    jumpDirection?: 'up' | 'down';
};

export default function Toast({
    onClick,
    onClickMessage,
    onDismiss,
    children,
    show,
    showActions,
    width,
    extraClasses = '',
    jumpDirection = 'down',
}: Props) {
    const {formatMessage} = useIntl();
    const jumpId = useId();
    const textId = useId();

    function handleDismiss() {
        if (typeof onDismiss === 'function') {
            onDismiss();
        }
    }

    const toastClass = classNames('toast', {
        toast__visible: show,
        [extraClasses]: extraClasses.length > 0,
    });

    const toastActionClass = classNames('toast__message', {
        toast__pointer: showActions,
    });

    const showJumpMessage = width > Constants.MOBILE_SCREEN_WIDTH;

    // The toast is a status line. When it can jump, its message is a button, named by where it jumps and described
    // by the toast's text; its close icon is a button too (the keyboard reaches them as before).

    return (
        <div
            className={toastClass}
            role='status'
        >
            <div
                className={toastActionClass}
                onClick={showActions ? onClick : undefined}
                role={showActions ? 'button' : undefined}
                aria-labelledby={showActions && showJumpMessage ? jumpId : undefined}
                aria-describedby={showActions && showJumpMessage ? textId : undefined}
            >
                {showActions && (
                    <div
                        className='toast__jump'
                        id={jumpId}
                    >
                        {jumpDirection === 'down' ? (<UnreadBelowIcon aria-hidden='true'/>) : (<UnreadAboveIcon aria-hidden='true'/>)}
                        {showJumpMessage && onClickMessage}
                    </div>
                )}
                <span id={textId}>
                    {children}
                </span>
            </div>
            <WithTooltip
                title={
                    <>
                        <FormattedMessage
                            id='general_button.close'
                            defaultMessage='Close'
                        />
                        <div className='tooltip__shortcut--txt'>
                            <FormattedMessage
                                id='general_button.esc'
                                defaultMessage='Esc'
                            />
                        </div>
                    </>
                }
                disabled={!showActions || !show}
            >
                <div
                    className='toast__dismiss'
                    onClick={handleDismiss}
                    role='button'
                    aria-label={formatMessage({id: 'toast.close', defaultMessage: 'Close notice'})}
                    data-testid={extraClasses ? `dismissToast-${extraClasses}` : 'dismissToast'}
                >
                    <CloseIcon
                        className='close-btn'
                        id='dismissToast'
                    />
                </div>
            </WithTooltip>
        </div>
    );
}
