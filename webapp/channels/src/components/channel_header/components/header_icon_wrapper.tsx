// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {ShortcutDefinition} from '@mattermost/shared/components/tooltip';
import {WithTooltip} from '@mattermost/shared/components/tooltip';

import NewChannelWithBoardTourTip from 'components/app_bar/new_channel_with_board_tour_tip';

import {suitePluginIds} from 'utils/constants';

type Props = {

    /**
     * ariaLabelOverride lets you override the aria-label which would otherwise use the tooltip text. This typically
     * shouldn't be needed.
     */
    ariaLabelOverride?: string;

    buttonClass?: string;
    buttonId: string;
    children: React.ReactNode;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    tooltip: string;
    tooltipShortcut?: ShortcutDefinition;
    isRhsOpen?: boolean;
    pluginId?: string;

    /**
     * For a button that opens and closes a panel: whether the panel shows it now, and the panel's id
     */
    ariaExpanded?: boolean;
    ariaControls?: string;

    /**
     * The id of an element describing the button, such as one giving the count it shows
     */
    ariaDescribedBy?: string;

    /**
     * Rendered as the button's data-agentom-id: a stable id for the Agent Object Model's projection
     */
    agentomId?: string;
};

const HeaderIconWrapper = (props: Props) => {
    const {
        ariaLabelOverride,
        buttonClass,
        buttonId,
        children,
        onClick,
        tooltip: tooltipText,
        tooltipShortcut,
        isRhsOpen,
        pluginId,
        ariaExpanded,
        ariaControls,
        ariaDescribedBy,
        agentomId,
    } = props;

    const boardsEnabled = pluginId === suitePluginIds.focalboard;

    const ariaLabelText = ariaLabelOverride ?? tooltipText;

    return (
        <>
            <WithTooltip
                title={isRhsOpen ? '' : tooltipText}
                shortcut={tooltipShortcut}
            >
                <button
                    id={buttonId}
                    aria-label={ariaLabelText}
                    aria-expanded={ariaExpanded}
                    aria-controls={ariaControls}
                    aria-describedby={ariaDescribedBy}
                    data-agentom-id={agentomId}
                    className={buttonClass || 'channel-header__icon'}
                    onClick={onClick}
                >
                    {children}
                </button>
            </WithTooltip>
            {boardsEnabled &&
                <NewChannelWithBoardTourTip
                    pulsatingDotPlacement={'start'}
                    pulsatingDotTranslate={{x: 0, y: -22}}
                />
            }
        </>
    );
};

export default HeaderIconWrapper;
