// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo} from 'react';
import {FormattedMessage, FormattedDate, FormattedTime, defineMessages, useIntl} from 'react-intl';
import {useDispatch} from 'react-redux';

import {ChevronRightIcon, ClockOutlineIcon} from '@mattermost/compass-icons/components';
import type {Post} from '@mattermost/types/posts';

import {addPostReminder} from 'mattermost-redux/actions/posts';

import {openModal} from 'actions/views/modals';

import * as Menu from 'components/menu';
import PostReminderCustomTimePicker from 'components/post_reminder_custom_time_picker_modal';

import {ModalIdentifiers} from 'utils/constants';
import {toUTCUnixInSeconds} from 'utils/datetime';
import {describeChoices} from 'utils/popup_descriptions';
import {getCurrentMomentForTimezone} from 'utils/timezone';

type Props = {
    userId: string;
    post: Post;
    isMilitaryTime: boolean;
    timezone?: string;
};

const PostReminders = {
    THIRTY_MINUTES: 'thirty_minutes',
    ONE_HOUR: 'one_hour',
    TWO_HOURS: 'two_hours',
    TOMORROW: 'tomorrow',
    CUSTOM: 'custom',
} as const;

export const postReminderMessages = defineMessages({
    remind: {
        id: 'post_info.post_reminder.menu',
        defaultMessage: 'Remind',
    },
    [PostReminders.THIRTY_MINUTES]: {
        id: 'post_info.post_reminder.sub_menu.thirty_minutes',
        defaultMessage: '30 mins',
    },
    [PostReminders.ONE_HOUR]: {
        id: 'post_info.post_reminder.sub_menu.one_hour',
        defaultMessage: '1 hour',
    },
    [PostReminders.TWO_HOURS]: {
        id: 'post_info.post_reminder.sub_menu.two_hours',
        defaultMessage: '2 hours',
    },
    [PostReminders.TOMORROW]: {
        id: 'post_info.post_reminder.sub_menu.tomorrow',
        defaultMessage: 'Tomorrow',
    },
    [PostReminders.CUSTOM]: {
        id: 'post_info.post_reminder.sub_menu.custom',
        defaultMessage: 'Custom',
    },
    customDescription: {
        id: 'post_info.post_reminder.sub_menu.custom.description',
        defaultMessage: 'Asks for a date and time, then sets the reminder',
    },
});

function PostReminderSubmenu(props: Props) {
    const intl = useIntl();
    const {formatMessage} = intl;
    const dispatch = useDispatch();

    function handlePostReminderMenuClick(id: string) {
        if (id === PostReminders.CUSTOM) {
            const postReminderCustomTimePicker = {
                modalId: ModalIdentifiers.POST_REMINDER_CUSTOM_TIME_PICKER,
                dialogType: PostReminderCustomTimePicker,
                dialogProps: {
                    postId: props.post.id,
                },
            };

            dispatch(openModal(postReminderCustomTimePicker));
        } else {
            const currentDate = getCurrentMomentForTimezone(props.timezone);

            let endTime = currentDate;
            if (id === PostReminders.THIRTY_MINUTES) {
                // add 30 minutes in current time
                endTime = currentDate.add(30, 'minutes');
            } else if (id === PostReminders.ONE_HOUR) {
                // add 1 hour in current time
                endTime = currentDate.add(1, 'hour');
            } else if (id === PostReminders.TWO_HOURS) {
                // add 2 hours in current time
                endTime = currentDate.add(2, 'hours');
            } else if (id === PostReminders.TOMORROW) {
                // set to next day 9 in the morning
                endTime = currentDate.add(1, 'day').set({hour: 9, minute: 0});
            }

            dispatch(addPostReminder(props.userId, props.post.id, toUTCUnixInSeconds(endTime.toDate())));
        }
    }

    const postReminderSubMenuItems = Object.values(PostReminders).map((postReminder) => {
        const labels = <FormattedMessage {...postReminderMessages[postReminder]}/>;

        let trailingElements = null;
        if (postReminder === PostReminders.TOMORROW) {
            const tomorrow = getCurrentMomentForTimezone(props.timezone).add(1, 'day').set({hour: 9, minute: 0}).toDate();

            trailingElements = (
                <span className={`postReminder-${postReminder}_timestamp`}>
                    <FormattedDate
                        value={tomorrow}
                        weekday='short'
                        timeZone={props.timezone}
                    />
                    {', '}
                    <FormattedTime
                        value={tomorrow}
                        timeStyle='short'
                        hour12={!props.isMilitaryTime}
                        timeZone={props.timezone}
                    />
                </span>
            );
        }

        // Custom opens a dialog that asks when
        if (postReminder === PostReminders.CUSTOM) {
            return (
                <Menu.Item
                    id={`remind_post_options_${postReminder}`}
                    key={`remind_post_options_${postReminder}`}
                    labels={labels}
                    trailingElements={trailingElements}
                    onClick={() => handlePostReminderMenuClick(postReminder)}
                    aria-haspopup='dialog'
                    aria-describedby={`remind_post_options_${postReminder}_description`}
                >
                    <span
                        id={`remind_post_options_${postReminder}_description`}
                        hidden={true}
                    >
                        {formatMessage(postReminderMessages.customDescription)}
                    </span>
                </Menu.Item>
            );
        }

        return (
            <Menu.Item
                id={`remind_post_options_${postReminder}`}
                key={`remind_post_options_${postReminder}`}
                labels={labels}
                trailingElements={trailingElements}
                onClick={() => handlePostReminderMenuClick(postReminder)}
            />
        );
    });

    // The submenu names its choices, from the same list as its items
    const choicesId = `remind_post_${props.post.id}_choices`;

    return (
        <Menu.SubMenu
            id={`remind_post_${props.post.id}`}
            menuAriaLabel={formatMessage({
                id: 'post_info.post_reminder.sub_menu.header',
                defaultMessage: 'Set a reminder for:',
            })}
            labels={<FormattedMessage {...postReminderMessages.remind}/>}
            aria-describedby={choicesId}
            leadingElement={<ClockOutlineIcon size={18}/>}
            trailingElements={
                <>
                    <span className={'dot-menu__item-trailing-icon'}><ChevronRightIcon size={16}/></span>
                    <span
                        id={choicesId}
                        hidden={true}
                    >
                        {describeChoices(intl, Object.values(PostReminders).map((postReminder) => postReminderMessages[postReminder]))}
                    </span>
                </>
            }
            menuId={`remind_post_${props.post.id}-menu`}
            subMenuHeader={
                <h5 className={'dot-menu__post-reminder-menu-header'}>
                    {formatMessage(
                        {
                            id: 'post_info.post_reminder.sub_menu.header',
                            defaultMessage: 'Set a reminder for:',
                        },
                    )}
                </h5>}
        >
            {postReminderSubMenuItems}
        </Menu.SubMenu>
    );
}

export default memo(PostReminderSubmenu);
