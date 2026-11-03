// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {DraggableProvidedDragHandleProps} from '@hello-pangea/dnd';
import classNames from 'classnames';
import React from 'react';

import {wrapEmojis} from 'utils/emoji_utils';

type StaticProps = {
    children?: React.ReactNode;
    displayName: string;
};

export const SidebarCategoryHeaderStatic = React.forwardRef((props: StaticProps, ref?: React.Ref<HTMLDivElement>) => {
    return (
        <div className='SidebarChannelGroupHeader SidebarChannelGroupHeader--static'>
            <div
                ref={ref}
                className='SidebarChannelGroupHeader_groupButton'
            >
                <div className='SidebarChannelGroupHeader_text'>
                    {wrapEmojis(props.displayName)}
                </div>
                {props.children}
            </div>
        </div>
    );
});
SidebarCategoryHeaderStatic.displayName = 'SidebarCategoryHeaderStatic';

type Props = StaticProps & {

    /**
     * The id of the header's button, which names the category's list
     */
    id?: string;

    /**
     * The id of the list of channels the button collapses and expands
     */
    controlsId?: string;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
    isCollapsed: boolean;
    isCollapsible: boolean;
    isDragging?: boolean;
    isDraggingOver?: boolean;
    isManaged?: boolean;
    muted: boolean;
    onClick: (event: React.MouseEvent<HTMLElement>) => void;

    /**
     * The button's data-agentom-id, and what hovering the header shows (data-agentom-reveals)
     */
    agentomId?: string;
    reveals?: string;
};

export const SidebarCategoryHeader = React.forwardRef(({
    children,
    controlsId,
    displayName,
    dragHandleProps,
    id,
    isCollapsed,
    isCollapsible = true,
    isDragging = false,
    isManaged = false,
    muted,
    onClick,
    agentomId,
    reveals,
}: Props, ref?: React.Ref<HTMLButtonElement>) => {
    // (Accessibility) Ensures interactive controls are not nested as they are not always announced
    // by screen readers or can cause focus problems for assistive technologies.
    if (dragHandleProps && dragHandleProps.role) {
        Reflect.deleteProperty(dragHandleProps, 'role');
    }

    return (
        <div
            className={classNames('SidebarChannelGroupHeader', {
                muted,
                dragging: isDragging,
            })}
        >
            <button
                ref={ref}
                id={id}
                className={classNames('SidebarChannelGroupHeader_groupButton')}
                aria-label={displayName}
                onClick={onClick}
                aria-expanded={!isCollapsed}
                aria-controls={controlsId}
                data-agentom-id={agentomId}
                data-agentom-reveals={agentomId ? reveals : undefined}
            >
                <i
                    className={classNames('icon icon-chevron-down', {
                        'icon-rotate-minus-90': isCollapsed,
                        'hide-arrow': !isCollapsible,
                    })}
                />
                {isManaged && <i className='icon icon-folder-outline'/>}
                <div
                    className='SidebarChannelGroupHeader_text'
                    {...dragHandleProps}
                    tabIndex={-1}
                >
                    {wrapEmojis(displayName)}
                </div>
            </button>
            {children}
        </div>
    );
});
SidebarCategoryHeader.displayName = 'SidebarCategoryHeader';
