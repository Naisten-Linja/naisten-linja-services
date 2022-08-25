import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Formik, Field, Form } from 'formik';
import moment from 'moment-timezone';

import { ApiBooking, ApiBookingWithColor } from '../../../common/constants-common';
import { useRequest } from '../../shared/http';
import { useNotifications } from '../../NotificationsContext';
import DataTable from 'react-data-table-component';
import { StyledDataTableWrapperDiv } from '../../shared/utils-frontend';

export const AllBookings: React.FC<RouteComponentProps> = () => {
  const [bookings, setBookings] = useState<Array<ApiBookingWithColor>>([]);
  const upcomingBookings = bookings.filter(({ end }) => new Date() < new Date(end));
  const pastBookings = bookings.filter(({ end }) => new Date() >= new Date(end));

  const { getRequest, deleteRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookings = useCallback(
    async (callback: (allBookings: Array<ApiBookingWithColor>) => void) => {
      const result = await getRequest<{ data: Array<ApiBookingWithColor> }>('/api/bookings/all', {
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
      <h2>Upcoming Bookings</h2>
      <div className="table-responsive">
        <BookingList
          bookings={upcomingBookings}
          fetchBookings={fetchBookings}
          setBookings={setBookings}
          handleDeleteBooking={handleDeleteBooking}
        />
      </div>
      <h2>Past Bookings</h2>
      <div className="table-responsive">
        <BookingList
          bookings={pastBookings}
          fetchBookings={fetchBookings}
          setBookings={setBookings}
          handleDeleteBooking={handleDeleteBooking}
          defaultSortAsc={false}
        />
      </div>
    </div>
  );
};

type UpdateBookingNoteFormProps = {
  booking: ApiBookingWithColor;
  fetchBookings: (callback: (bookings: Array<ApiBookingWithColor>) => void) => Promise<void>;
  setBookings: (bookings: Array<ApiBookingWithColor>) => void;
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

type BookingListProps = {
  bookings: Array<ApiBookingWithColor>;
  fetchBookings: (callback: (bookings: Array<ApiBookingWithColor>) => void) => Promise<void>;
  setBookings: (bookings: Array<ApiBookingWithColor>) => void;
  handleDeleteBooking: (bookingUuid: string) => () => Promise<void>;
  defaultSortAsc?: boolean;
};

const BookingList: React.FC<BookingListProps> = ({
  bookings,
  fetchBookings,
  setBookings,
  handleDeleteBooking,
  defaultSortAsc,
}) => {
  const dateSort = (a: { start: string }, b: { start: string }) => {
    return new Date(a.start) > new Date(b.start) ? 1 : -1;
  };

  const columns = [
    {
      id: 1,
      name: 'Type',
      selector: (row: ApiBookingWithColor) => row.bookingType.name,
      format: (row: ApiBookingWithColor) => (
        <div
          className="padding-xxs border-radius color-white font-weight-bold"
          style={{ background: row.bookingType.color }}
        >
          {row.bookingType.name}
        </div>
      ),
      wrap: true,
    },
    {
      id: 2,
      name: 'Date',
      selector: (row: ApiBookingWithColor) =>
        `${moment(row.start).format('ddd Do MMM YYYY HH:mm')}`,
      sortable: true,
      sortFunction: dateSort,
      wrap: true,
      format: (row: ApiBookingWithColor) => {
        return (
          <>
            {moment(row.start).format('ddd Do MMM YYYY')}
            <br />
            {moment(row.start).format('HH:mm')} - {moment(row.end).format('HH:mm')}
          </>
        );
      },
    },
    {
      id: 3,
      name: 'Personal Detail',
      selector: (row: ApiBookingWithColor) => row.fullName,
      format: (row: ApiBookingWithColor) => (
        <div className="flex flex-column">
          <span>{row.fullName}</span>
          <span>{row.email}</span>
          <span>{row.phone}</span>
          <span>Work location: {row.workingRemotely ? 'Remote' : 'Office'}</span>
        </div>
      ),
      wrap: true,
      grow: 2,
    },
    {
      id: 4,
      name: 'User Email',
      selector: (row: ApiBookingWithColor) => row.user.email,
      wrap: true,
      grow: 2,
    },
    {
      id: 5,
      name: 'Note',
      selector: (row: ApiBookingWithColor) => row.bookingNote,
      format: (row: ApiBookingWithColor) => (
        <UpdateBookingNoteForm
          fetchBookings={fetchBookings}
          setBookings={setBookings}
          booking={{
            uuid: row.uuid,
            end: row.end,
            start: row.start,
            fullName: row.fullName,
            phone: row.phone,
            email: row.email,
            bookingType: row.bookingType,
            bookingNote: row.bookingNote,
            user: row.user,
            workingRemotely: row.workingRemotely,
          }}
        />
      ),
      grow: 2,
    },
    {
      id: 6,
      name: '',
      selector: () => '',
      format: (row: ApiBookingWithColor) => (
        <button
          className="button button-xxs button-border button-error"
          onClick={handleDeleteBooking(row.uuid)}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <StyledDataTableWrapperDiv>
      <DataTable
        columns={columns}
        data={bookings}
        defaultSortFieldId={2}
        defaultSortAsc={defaultSortAsc}
        pagination
        responsive
      />
    </StyledDataTableWrapperDiv>
  );
};
