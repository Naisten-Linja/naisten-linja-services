import ExceptionsDatePicker from './ExceptionsDatePicker';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Formik, Form } from 'formik';
import { BookingSlot, BookingTypeDailyRules } from '../../../../common/constants-common';
import userEvent from '@testing-library/user-event';

describe('ExceptionsDatePicker', () => {
  const closeModalMock = jest.fn();

  // A booking slot is chosen for Tuesday, so only Tuesdays can be selected
  const initialValues = {
    name: '',
    rules: [0, 1, 2, 3, 4, 5, 6].map((index) => ({
      enabled: true,
      slots:
        index === 2 ? [{ start: '13:00', end: '15:00', seats: 4 }] : ([] as Array<BookingSlot>),
    })) as BookingTypeDailyRules,
    exceptions: [] as Array<string>,
  };
  const onSubmitMock = jest.fn();

  it('renders', () => {
    render(
      <Formik initialValues={initialValues} onSubmit={onSubmitMock}>
        <ExceptionsDatePicker showDatePicker={true} closeModal={closeModalMock} />
      </Formik>,
    );

    expect(screen.getByText('exceptions_date_picker.choose_exceptions')).toBeInTheDocument();
  });

  it('when an exception is chosen and form is submitted, submits the exception', async () => {
    render(
      <Formik initialValues={initialValues} onSubmit={onSubmitMock}>
        <Form>
          <ExceptionsDatePicker showDatePicker={true} closeModal={closeModalMock} />
          <button type="submit">Submit</button>
        </Form>
      </Formik>,
    );

    //Choose tomorrow's date (Tuesday) from the calendar, mocked date for today is Monday 2019-04-22"
    userEvent.click(screen.getByText('23'));

    //Close the modal
    userEvent.click(screen.getByRole('button', { name: 'exceptions_date_picker.close' }));

    //Submit the form
    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exceptions: expect.arrayContaining(['2019-04-23']),
        }),
        expect.anything(),
      ),
    );
  });

  it('when a disabled date is clicked and form is submitted, does not submit disabled date', async () => {
    render(
      <Formik initialValues={initialValues} onSubmit={onSubmitMock}>
        <Form>
          <ExceptionsDatePicker showDatePicker={true} closeModal={closeModalMock} />
          <button type="submit">Submit</button>
        </Form>
      </Formik>,
    );

    //Other days than Tuesdays are disabled, chosen date 2019-04-24 is Wednesday
    userEvent.click(screen.getByText('24'));

    //Close the modal
    userEvent.click(screen.getByRole('button', { name: 'exceptions_date_picker.close' }));

    //Submit the form
    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          exceptions: expect.arrayContaining([]),
        }),
        expect.anything(),
      ),
    );
  });
});
