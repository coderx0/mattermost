// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useEffect, useId} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';

import {AlertCircleOutlineIcon} from '@mattermost/compass-icons/components';
import {Button} from '@mattermost/shared/components/button';

import LoadingSpinner from 'components/widgets/loading/loading_spinner';

import './save_changes_panel.scss';

export type SaveChangesPanelState = 'editing' | 'saved' | 'error' | undefined;

const CLOSE_TIMEOUT = 1200;

type Props = {
    handleSubmit: () => void;
    handleCancel: () => void;
    handleClose: () => void;
    tabChangeError?: boolean;
    state: SaveChangesPanelState;
    customErrorMessage?: string;
    customSavedMessage?: string;

    /**
     * What was saved ("Channel info"), said before "Settings saved" in visually hidden text, so the notice names it
     * without changing what it shows
     */
    savedSubject?: string;
    saveButtonText?: React.ReactNode;
    cancelButtonText?: React.ReactNode;
    saving?: boolean;

    /**
     * What the save button keeps, given to it as its description: "Saves the channel's name, URL, type…"
     */
    saveButtonDescription?: string;

    /**
     * Data attributes added to the save button, such as the Agent Object Model's data-agentom-risk and
     * data-agentom-confirmation when saving asks first or is risky
     */
    saveButtonAttributes?: {[dataAttribute: `data-${string}`]: string | undefined};

    /**
     * The start of the data-agentom-id of the panel's buttons: `<agentomId>.save`, `.discard` (Undo or Reset) and `.close`
     */
    agentomId?: string;
};
function SaveChangesPanel({
    handleSubmit,
    handleCancel,
    handleClose,
    tabChangeError = false,
    state = 'editing',
    customErrorMessage,
    customSavedMessage,
    savedSubject,
    saveButtonText,
    cancelButtonText,
    saving = false,
    saveButtonDescription,
    saveButtonAttributes,
    agentomId,
}: Props) {
    const {formatMessage} = useIntl();
    const saveButtonDescriptionId = useId();
    const panelClassName = classNames('SaveChangesPanel', {error: tabChangeError || state === 'error'}, {saved: state === 'saved'});
    const messageClassName = classNames('SaveChangesPanel__message', {error: tabChangeError || state === 'error'}, {saved: state === 'saved'});

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (state === 'saved') {
            timeoutId = setTimeout(() => {
                handleClose();
            }, CLOSE_TIMEOUT);
        }

        return () => clearTimeout(timeoutId);
    }, [handleClose, state]);

    const generateMessage = () => {
        if (customErrorMessage && (tabChangeError || state === 'error')) {
            return customErrorMessage;
        }

        if (tabChangeError || state === 'editing') {
            return (
                <FormattedMessage
                    id='saveChangesPanel.message'
                    defaultMessage='You have unsaved changes'
                />
            );
        }

        if (state === 'error') {
            return (
                <FormattedMessage
                    id='saveChangesPanel.error'
                    defaultMessage='There was an error saving your settings'
                />
            );
        }

        if (customSavedMessage) {
            return <span>{customSavedMessage}</span>;
        }
        return (
            <>
                {savedSubject && <span className='sr-only'>{`${savedSubject}: `}</span>}
                <FormattedMessage
                    id='saveChangesPanel.saved'
                    defaultMessage='Settings saved'
                />
            </>
        );
    };

    const generateControlButtons = () => {
        if (state === 'saved') {
            return (
                <div className='SaveChangesPanel__btn-ctr'>
                    <button
                        id='panelCloseButton'
                        type='button'
                        className='btn btn-icon btn-sm'
                        onClick={handleClose}
                        aria-label={formatMessage({id: 'saveChangesPanel.close', defaultMessage: 'Close notice'})}
                        data-agentom-id={agentomId && `${agentomId}.close`}
                    >
                        <i
                            className='icon icon-close'
                            aria-hidden='true'
                        />
                    </button>
                </div>
            );
        }

        const saveButtonDisabled = saving || tabChangeError || state === 'error';

        return (
            <div className='SaveChangesPanel__btn-ctr'>
                <Button
                    data-testid='SaveChangesPanel__cancel-btn'
                    emphasis='tertiary'
                    size='sm'
                    className={classNames('SaveChangesPanel__cancel-btn', {error: tabChangeError || state === 'error'})}
                    onClick={handleCancel}
                    disabled={saving}
                    data-agentom-id={agentomId && `${agentomId}.discard`}
                >
                    {cancelButtonText || (
                        <FormattedMessage
                            id='saveChangesPanel.cancel'
                            defaultMessage='Undo'
                        />
                    )}
                </Button>
                <Button
                    {...saveButtonAttributes}
                    data-testid='SaveChangesPanel__save-btn'
                    emphasis='primary'
                    size='sm'
                    className={classNames('SaveChangesPanel__save-btn', {error: tabChangeError || state === 'error', 'btn-force-disabled': saving})}
                    onClick={handleSubmit}
                    disabled={saveButtonDisabled}
                    aria-describedby={saveButtonDescription ? saveButtonDescriptionId : undefined}
                    data-agentom-id={agentomId && `${agentomId}.save`}
                >
                    {saving ? (
                        <LoadingSpinner
                            text={
                                <FormattedMessage
                                    id='saveChangesPanel.saving'
                                    defaultMessage='Saving...'
                                />
                            }
                        />
                    ) : (saveButtonText || (
                        <FormattedMessage
                            id='saveChangesPanel.save'
                            defaultMessage='Save'
                        />
                    ))}
                </Button>
                {saveButtonDescription && (
                    <span
                        id={saveButtonDescriptionId}
                        hidden={true}
                    >
                        {saveButtonDescription}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className={panelClassName}>
            <p
                className={messageClassName}
                role='status'
            >
                <AlertCircleOutlineIcon
                    size={18}
                    color={'currentcolor'}
                />
                {generateMessage()}
            </p>
            {generateControlButtons()}
        </div>
    );
}
export default SaveChangesPanel;
