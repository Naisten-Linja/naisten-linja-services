import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Formik, Field, Form } from 'formik';
import moment from 'moment-timezone';

import { ApiBooking } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';

export const AllBookings: React.FC<RouteComponentProps> = () => {
  const [bookings, setBookings] = useState<Array<ApiBooking>>([]);
  const { getRequest, deleteRequest } = useRequest();

  const { addNotification } = useNotifications();

  const fetchBookings = useCallback(
    async (callback: (allBookings: Array<ApiBooking>) => void) => {
      const result = await getRequest<{ data: Array<ApiBooking> }>('/api/bookings/all', {
        useJwt: true,
      });
      if (result.data.data) {
        const bookings = result.data.data.sort(
          (a, b) =>
            new Date(a.start).getTime() - new Date(b.start).getTime() ||
            a.email.localeCompare(b.email),
        );
        callback(bookings);
      }
    },
    [getRequest],
  );

  useEffect(() => {
    let updateStateAfterFetch = true;
    fetchBookings((bookings) => {
      if (bookings && updateStateAfterFetch) {
        setBookings(bookings);
      }
    });
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setBookings, fetchBookings]);

  const handleDeleteBooking = useCallback(
    (bookingUuid: string) => async () => {
      if (window.confirm('Are you sure to delete this booking slot?')) {
        const deleteResult = await deleteRequest<{ data: { success: boolean } }>(
          `/api/bookings/booking/${bookingUuid}`,
          { useJwt: true },
        );
        if (deleteResult.data.data.success) {
          addNotification({ type: 'success', message: 'Booking was successefully deleted' });
          fetchBookings((bookings) => {
            setBookings(bookings);
          });
        }
      }
    },
    [fetchBookings, addNotification, deleteRequest],
  );

  return (
    <div className="width-100">
      <h1>Manage bookings</h1>
      <p>
        <b>Please note booking times are in Europe/Helsinki timezone</b>
      </p>
      <table className="table-responsive">
        <thead>
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>Slot time</th>
            <th>Booking details</th>
            <th style={{ width: '18rem' }}>Note</th>
            <th>User email</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(
            ({
              uuid,
              end,
              start,
              fullName,
              phone,
              email,
              bookingType,
              bookingNote,
              user,
              workingRemotely,
            }) => (
              <tr key={uuid}>
                <td>{bookingType.name}</td>
                <td>{moment(start).format('ddd Do MMM YYYY')}</td>
                <td>
                  {moment(start).format('HH:mm')} - {moment(end).format('HH:mm')}
                </td>
                <td>
                  {fullName}
                  <br />
                  {email}
                  <br />
                  {phone}
                  <br />
                  Work location: {workingRemotely ? 'Remote' : 'Office'}
                </td>
                <td>
                  <UpdateBookingNoteForm
                    fetchBookings={fetchBookings}
                    setBookings={setBookings}
                    booking={{
                      uuid,
                      end,
                      start,
                      fullName,
                      phone,
                      email,
                      bookingType,
                      bookingNote,
                      user,
                      workingRemotely,
                    }}
                  />
                </td>
                <td>{user.email}</td>
                <td>
                  <button
                    className="button button-xxs button-border button-error"
                    onClick={handleDeleteBooking(uuid)}
                  >
                    Delete
                  </button>{' '}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
};

type UpdateBookingNoteFormProps = {
  booking: ApiBooking;
  fetchBookings: (callback: (bookings: Array<ApiBooking>) => void) => Promise<void>;
  setBookings: (bookings: Array<ApiBooking>) => void;
};

const UpdateBookingNoteForm: React.FC<UpdateBookingNoteFormProps> = ({
  booking,
  fetchBookings,
  setBookings,
}) => {
  const { uuid, fullName, email, phone, bookingNote } = booking;
  const [isEditing, setIsEditing] = useState(false);
  const { addNotification } = useNotifications();
  const { putRequest } = useRequest();

  const updateBooking = useCallback(
    async (note: string) => {
      try {
        const result = await putRequest<{ data: ApiBooking }>(
          `/api/bookings/booking/${uuid}`,
          {
            fullName,
            email,
            phone,
            bookingNote: note,
          },
          { useJwt: true },
        );
        if (result.data.data) {
          addNotification({ type: 'success', message: 'Booking note was updated' });
          fetchBookings((bookings) => {
            setBookings(bookings);
          });
        }
      } catch (err) {
        addNotification({ type: 'error', message: 'Failed to update booking note' });
      } finally {
        setIsEditing(false);
      }
    },
    [putRequest, fullName, email, phone, uuid, addNotification, fetchBookings, setBookings],
  );

  const initialFormValues = {
    bookingNote,
  };

  if (!isEditing) {
    return (
      <>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{bookingNote}</pre>
        <button
          className="button button-xxs"
          onClick={() => {
            setIsEditing(true);
          }}
        >
          Edit
        </button>
      </>
    );
  }

  return (
    <Formik
      initialValues={initialFormValues}
      onSubmit={({ bookingNote }) => {
        updateBooking(bookingNote);
      }}
    >
      <Form>
        <Field type="text" name="bookingNote" as="textarea" aria-label="Booking note" />
        <input
          type="submit"
          className="button button-xxs button-primary"
          style={{ width: '3rem', marginRight: '0.2rem' }}
          value="Save"
        />
        <button type="button" className="button button-xxs" onClick={() => setIsEditing(false)}>
          Cancel
        </button>
      </Form>
    </Formik>
  );
};
