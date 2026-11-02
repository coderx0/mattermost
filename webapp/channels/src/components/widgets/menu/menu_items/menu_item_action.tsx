// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';

import menuItem from './menu_item';

type Props = {
    onClick: (e: React.MouseEvent) => void;
    text: React.ReactNode;
    extraText?: string;
    id?: string;
    buttonClass?: string;
    rightDecorator?: React.ReactNode;
    isDangerous?: boolean;
    disabled?: boolean;
    sibling?: React.ReactNode;
    iconClassName?: string;

    /**
     * The Agent Object Model's data-agentom-* metadata (an id, a risk, a confirmation), given to the button
     */
    [agentomAttribute: `data-agentom-${string}`]: string | undefined;
};
export const MenuItemActionImpl = ({
    onClick,
    text,
    extraText,
    id,
    buttonClass,
    rightDecorator,
    isDangerous,
    disabled,
    sibling,
    iconClassName,
    ...rest
}: Props) => (
    <>
        <button
            {...agentomAttributes(rest)}
            data-testid={id}
            id={id}
            className={classNames('style--none', buttonClass, {
                'MenuItem__with-help': extraText,
                'MenuItem__with-sibling': sibling,
                disabled,
                MenuItem__dangerous: isDangerous,
            })}
            onClick={onClick}
            disabled={disabled}
        >
            {iconClassName && <i className={`icon ${iconClassName}`}/>}
            {text && <span className='MenuItem__primary-text'>{text}{rightDecorator}</span>}
            {extraText && <span className='MenuItem__help-text'>{extraText}</span>}
        </button>
        {sibling}
    </>

);

// Only the data-agentom-* attributes among the other props are passed on, as before no other props were
function agentomAttributes(props: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-agentom-')));
}

const MenuItemAction = menuItem(MenuItemActionImpl);
MenuItemAction.displayName = 'MenuItemAction';

export default MenuItemAction;
