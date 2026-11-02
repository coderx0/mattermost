// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {JSX, ReactNode} from 'react';

import './modal_section.scss';

type Props = {
    title?: ReactNode;
    description?: ReactNode;
    content: JSX.Element;
    titleSuffix?: JSX.Element;

    /**
     * Makes the section a region named by its title, with this data-agentom-id: a named section of the Agent
     * Object Model's projection
     */
    agentomId?: string;
};

function ModalSection({
    title,
    description,
    content,
    titleSuffix,
    agentomId,
}: Props) {
    const titleId = agentomId ? `${agentomId}-title` : undefined;
    const titleComponent = title && (
        <h4 className='modalSectionTitle'>
            {titleId ? <span id={titleId}>{title}</span> : title}
            {titleSuffix}
        </h4>
    );

    const descriptionComponent = description && (
        <p className='modalSectionDescription'>
            {description}
        </p>
    );

    return (
        <section
            className='mm-modal-generic-section'
            aria-labelledby={title ? titleId : undefined}
            data-agentom-id={agentomId}
            data-agentom-kind={agentomId ? 'section' : undefined}
        >
            {(title || description) && (
                <div className='modalSectionHeader'>
                    {titleComponent}
                    {descriptionComponent}
                </div>
            )}
            <div className='modalSectionContent'>
                {content}
            </div>
        </section>
    );
}

export default ModalSection;
