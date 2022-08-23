import React from 'react';
import { BookingTypeForm } from './BookingTypeForm';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { BookingSlot, BookingTypeDailyRules } from '../../../common/constants-common';
import axios from 'axios';

jest.spyOn(axios, 'post');

describe('BookingTypeForm', () => {
  const onSubmitMock = jest.fn();
  const initialValues = {
    name: '',
    rules: [0, 1, 2, 3, 4, 5, 6].map(() => ({
      enabled: true,
      slots: [] as Array<BookingSlot>,
    })) as BookingTypeDailyRules,
    exceptions: [] as Array<string>,
    additionalInformation: null,
  };
  beforeEach(() => {
    render(
      <Formik initialValues={initialValues} onSubmit={onSubmitMock}>
        <BookingTypeForm />
      </Formik>,
    );
  });

  const addSlotForMonday = () => {
    userEvent.click(screen.getByTestId('add-slot-button-monday'));
    userEvent.type(screen.getByRole('textbox', { name: 'start date' }), '12:00');
    userEvent.type(screen.getByRole('textbox', { name: 'end date' }), '13:00');
    userEvent.type(screen.getByRole('spinbutton', { name: 'seats' }), '3');
  };

  it('should not show button for choosing exceptions when there are no picked slots', () => {
    expect(screen.queryByText('Add exceptions')).toBeDisabled();
  });

  it('when a slot is picked, should show button for choosing exceptions', async () => {
    addSlotForMonday();

    await waitFor(() => expect(screen.getByText('Add exceptions')).not.toBeDisabled());
  });

  it('given a slot is picked, when choosing exceptions button is clicked, shows modal for choosing dates', async () => {
    addSlotForMonday();

    userEvent.click(screen.getByRole('button', { name: 'Add exceptions' }));

    await waitFor(() => expect(screen.getByTestId('exceptions-date-picker')).toBeInTheDocument());
  });

  it('shows a text field for additional information', () => {
    expect(screen.getByText('Additional information')).toBeInTheDocument();
  });

  it('when a booking type is added and form is submitted, submits the booking type', async () => {
    userEvent.type(screen.getByRole('textbox', { name: 'booking type name' }), 'some name');
    userEvent.type(
      screen.getByRole('textbox', { name: 'additional information' }),
      'some additional information',
    );
    addSlotForMonday();

    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        '/api/booking-types',
        expect.objectContaining({
          name: 'some name',
          additionalInformation: 'some additional information',
          rules: expect.arrayContaining([
            {
              enabled: true,
              slots: [{ end: '13:00', seats: 3, start: '12:00' }],
            },
          ]),
        }),
        expect.anything(),
      ),
    );
  });
});
