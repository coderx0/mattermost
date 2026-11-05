// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {fireEvent, renderWithContext, screen} from 'tests/react_testing_utils';

import type {Value} from './multiselect';
import MultiSelectList from './multiselect_list';
import type {Props as MultiSelectProps} from './multiselect_list';

describe('components/multiselect/multiselect', () => {
    const optionsNumber = 8;
    const users: Value[] = [];
    for (let i = 0; i < optionsNumber; i++) {
        users.push({id: `${i}`, label: `${i}`, value: `${i}`});
    }

    const selectedItemRef = {
        current: {
            getBoundingClientRect: jest.fn(() => ({
                bottom: 100,
                top: 50,
            })) as any,
            scrollIntoView: jest.fn(),
        },
    } as any;

    const baseProps = {
        ariaLabelRenderer: (() => <div/>) as any,
        loading: false,
        onAdd: jest.fn(),
        onSelect: jest.fn(),
        optionRenderer: (() => <div/>) as any,
        selectedItemRef,
        options: users,
    };

    test('MultiSelectList should have selected item scrollIntoView to align at bottom of list', () => {
        const renderOption: MultiSelectProps<Value>['optionRenderer'] = (option, isSelected, onAdd, onMouseMove) => {
            return (
                <p
                    key={option.id}
                    onClick={() => onAdd(option)}
                    onMouseMove={() => onMouseMove(option)}
                >
                    {option.id}
                </p>
            );
        };

        renderWithContext(
            <MultiSelectList
                {...baseProps}
                optionRenderer={renderOption}
            />,
        );

        const listEl = document.getElementById('multiSelectList')!;
        jest.spyOn(listEl, 'getBoundingClientRect').mockReturnValue({
            bottom: 50,
            top: 50,
        } as DOMRect);

        // fireEvent on document used because userEvent.keyboard requires element focus
        fireEvent.keyDown(document, {key: 'ArrowDown'});

        expect(selectedItemRef.current.scrollIntoView).toHaveBeenCalledWith(false);
    });

    test('MultiSelectList should have selected item scrollIntoView to align at top of list', () => {
        const renderOption: MultiSelectProps<Value>['optionRenderer'] = (option, isSelected, onAdd, onMouseMove) => {
            return (
                <p
                    key={option.id}
                    onClick={() => onAdd(option)}
                    onMouseMove={() => onMouseMove(option)}
                >
                    {option.id}
                </p>
            );
        };

        renderWithContext(
            <MultiSelectList
                {...baseProps}
                optionRenderer={renderOption}
            />,
        );

        const listEl = document.getElementById('multiSelectList')!;
        jest.spyOn(listEl, 'getBoundingClientRect').mockReturnValue({
            bottom: 200,
            top: 60,
        } as DOMRect);

        // fireEvent on document used because userEvent.keyboard requires element focus
        fireEvent.keyDown(document, {key: 'ArrowDown'});

        expect(selectedItemRef.current.scrollIntoView).toHaveBeenCalledWith(true);
    });

    describe('as a listbox', () => {
        const people: Value[] = [
            {id: 'k', label: 'karen.austin', value: 'k'},
            {id: 'u', label: 'user-1', value: 'u'},
        ];

        // a row as the dialogs render one: a plain clickable div, its picture's text and its name inside
        const renderRow: MultiSelectProps<Value>['optionRenderer'] = (option, isSelected, onAdd, onMouseMove) => (
            <div
                key={option.id}
                className={'more-modal__row clickable ' + (isSelected ? 'more-modal__row--selected' : '')}
                onClick={() => onAdd(option)}
                onMouseMove={() => onMouseMove(option)}
            >
                <img alt='user profile image'/>
                <span>{'Offline'}</span>
                <span>{option.label}</span>
            </div>
        );

        test('says its rows are options of a named listbox, the highlighted one selected, each by its label\'s id', () => {
            const onAdd = jest.fn();
            renderWithContext(
                <MultiSelectList
                    {...baseProps}
                    options={people}
                    onAdd={onAdd}
                    ariaLabelRenderer={(option) => option?.label ?? ''}
                    optionRenderer={renderRow}
                    listLabel='Search results'
                    optionIdPrefix='channel-invite'
                />,
            );

            expect(screen.getByRole('listbox', {name: 'Search results'})).toBeInTheDocument();
            // named by the label the list announces, not by the picture's text and status the row also holds
            expect(screen.getByRole('option', {name: 'karen.austin'})).toBeInTheDocument();
            const options = screen.getAllByRole('option');
            expect(options.map((o) => o.getAttribute('aria-label'))).toEqual(['karen.austin', 'user-1']);
            expect(options.map((o) => o.getAttribute('data-agentom-id'))).toEqual(['channel-invite.option.karen-austin', 'channel-invite.option.user-1']);
            expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual(['false', 'false']);

            // the arrow keys move the highlight, which is the selected option
            fireEvent.keyDown(document, {key: 'ArrowDown'});
            expect(screen.getAllByRole('option').map((o) => o.getAttribute('aria-selected'))).toEqual(['true', 'false']);

            // choosing an option is clicking it, as before
            fireEvent.click(screen.getByRole('option', {name: 'user-1'}));
            expect(onAdd).toHaveBeenCalledWith(people[1]);
        });

        test('stays as it was without a name: no listbox, no options', () => {
            renderWithContext(
                <MultiSelectList
                    {...baseProps}
                    options={people}
                    ariaLabelRenderer={(option) => option?.label ?? ''}
                    optionRenderer={renderRow}
                />,
            );

            expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            expect(screen.queryAllByRole('option')).toHaveLength(0);
            expect(document.getElementById('multiSelectList')).toHaveAttribute('role', 'presentation');
        });
    });
});
