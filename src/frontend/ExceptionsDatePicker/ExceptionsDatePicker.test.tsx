import ExceptionsDatePicker from './ExceptionsDatePicker';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Formik, Form } from 'formik';
import { BookingSlot, BookingTypeDailyRules } from '../../common/constants-common';
import userEvent from '@testing-library/user-event';

describe('ExceptionsDatePicker', () => {
  const closeModalMock = jest.fn();
  const initialValues = {
    name: '',
    rules: [0, 1, 2, 3, 4, 5, 6].map(() => ({
      enabled: true,
      slots: [] as Array<BookingSlot>,
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

    expect(screen.getByText('Choose exceptions')).toBeInTheDocument();
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

    //Choose tomorrow's date from the calendar, mocked date for today is 2019-04-22"
    userEvent.click(screen.getByText('23'));

    //Close the modal
    userEvent.click(screen.getByRole('button', { name: 'Close' }));

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
});
