import React from 'react';
import { Formik, Form } from 'formik';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BookingTypeDateRangesField } from './BookingTypeDateRangesField';
import { BookingTypeFormValue } from './BookingTypeForm';

afterEach(() => {
  cleanup();
});

describe('BookingTypeDateRangesField', () => {
  const initialValues: Partial<BookingTypeFormValue> = {
    name: '',
    dateRanges: [],
  };
  const onSubmitMock = jest.fn();

  it('renders text if no date ranges are selected', () => {
    render(
      <Formik initialValues={initialValues} onSubmit={onSubmitMock}>
        <BookingTypeDateRangesField />
      </Formik>,
    );

    expect(
      screen.getByText('No date ranges selected, this booking type is never available.'),
    ).toBeInTheDocument();
  });

  it('when a date range is chosen and the form is submitted, submits the exception', async () => {
    render(
      <Formik initialValues={initialValues} onSubmit={onSubmitMock}>
        <Form>
          <BookingTypeDateRangesField />
          <button type="submit">Submit</button>
        </Form>
      </Formik>,
    );

    // Open the modal
    userEvent.click(screen.getByRole('button', { name: 'Add date range' }));

    // `find` because waiting for the modal to open, check the header text
    expect(
      await screen.findByText('Select range of dates when this booking type needs to be active'),
    ).toBeInTheDocument();

    //Choose start and end date in the future (Tuesday, Thursday) from the calendar, mocked date for today is Monday 2019-04-22"
    userEvent.click(screen.getAllByText('23')[0]);
    userEvent.click(screen.getAllByText('25')[1]);

    //Close the modal
    userEvent.click(screen.getByRole('button', { name: 'Close' }));

    //Submit the form
    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRanges: [{ start: '2019-04-23', end: '2019-04-25' }],
        }),
        expect.anything(),
      ),
    );
  });

  it('shows correct initial value, supports clearing date selection', async () => {
    const initialValues2: Partial<BookingTypeFormValue> = {
      name: '',
      dateRanges: [{ start: null, end: '2019-04-15' }],
    };

    render(
      <Formik initialValues={initialValues2} onSubmit={onSubmitMock}>
        <Form>
          <BookingTypeDateRangesField />
          <button type="submit">Submit</button>
        </Form>
      </Formik>,
    );

    // Open the modal
    userEvent.click(screen.getByRole('button', { name: 'EDIT' }));

    // `find` because waiting for the modal to open, check the header text
    expect(
      await screen.findByText('Select range of dates when this booking type needs to be active'),
    ).toBeInTheDocument();

    expect(screen.getAllByText('Always until 15.04.2019')[0]).toBeInTheDocument();

    //Other days than Tuesdays are disabled, chosen date 2019-04-24 is Wednesday
    userEvent.click(screen.getAllByText('12')[0]);

    expect(await screen.findByText('2019-04-12')).toBeInTheDocument();

    expect(screen.getAllByText('From 12.04.2019 to 15.04.2019')[0]).toBeInTheDocument();

    // Clear the selection of end date
    userEvent.click(screen.getAllByRole('button', { name: 'Clear selection' })[1]);

    // Check the contents now
    expect(screen.getAllByText('Forever after 12.04.2019')[0]).toBeInTheDocument();

    //Close the modal
    userEvent.click(screen.getByRole('button', { name: 'Close' }));

    //Submit the form
    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRanges: [{ start: '2019-04-12', end: null }],
        }),
        expect.anything(),
      ),
    );
  });

  it('can delete date ranges', async () => {
    const initialValues: Partial<BookingTypeFormValue> = {
      name: '',
      dateRanges: [
        { start: null, end: '2019-04-15' },
        { start: '2019-04-20', end: '2019-04-20' },
      ],
    };

    render(
      <Formik initialValues={initialValues} onSubmit={onSubmitMock}>
        <Form>
          <BookingTypeDateRangesField />
          <button type="submit">Submit</button>
        </Form>
      </Formik>,
    );

    // Delete the second date range
    userEvent.click(screen.getAllByRole('button', { name: 'Delete this date range' })[1]);

    //Submit the form
    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRanges: [{ start: null, end: '2019-04-15' }],
        }),
        expect.anything(),
      ),
    );

    // Delete the first date range
    userEvent.click(screen.getAllByRole('button', { name: 'Delete this date range' })[0]);

    //Submit the form
    userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRanges: [],
        }),
        expect.anything(),
      ),
    );
  });
});
