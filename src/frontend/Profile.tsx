import React, { useCallback, useEffect, useState } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import DataTable from 'react-data-table-component';

import { useRequest } from './http';
import {
  ApiBooking,
  ApiBookingType,
  ApiUserData,
  BookingTypeColors,
  TokenUserData,
  UserRole,
} from '../common/constants-common';
import moment from 'moment';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

export const Profile: React.FunctionComponent<RouteComponentProps<{ userUuid: string }>> = ({
  userUuid,
}) => {
  const { user: loggedInUser } = useAuth();

  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingType>>([]);
  const [bookings, setBookings] = useState<Array<ApiBooking>>([]);
  const [user, setUser] = useState<ApiUserData>();
  const upcomingBookings = bookings.filter(({ end }) => new Date() < new Date(end));
  const pastBookings = bookings.filter(({ end }) => new Date() >= new Date(end));

  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingType> }>(
        '/api/booking-types',
        { useJwt: true },
      );
      setBookingTypes(
        bookingTypesResult.data.data.sort((a, b) =>
          a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1,
        ),
      );
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to get all booking types' });
    }
  }, [addNotification, setBookingTypes, getRequest]);

  useEffect(() => {
    fetchBookingTypes();
  }, [fetchBookingTypes]);

  useEffect(() => {
    let updateStateAfterFetch = true;
    const getUserProfile = async () => {
      const result = await getRequest<{ data: ApiUserData }>(`/api/profile/${userUuid}`, {
        useJwt: true,
      });
      if (result.data.data && updateStateAfterFetch) {
        setUser(result.data.data);
      }
    };
    getUserProfile();
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setUser, userUuid]);

  useEffect(() => {
    let updateStateAfterFetch = true;
    const getBookings = async () => {
      const result = await getRequest<{ data: Array<ApiBooking> }>(
        `/api/bookings/user/${userUuid}`,
        {
          useJwt: true,
        },
      );
      if (result.data.data && updateStateAfterFetch) {
        setBookings(result.data.data);
      }
    };
    getBookings();
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setBookings, userUuid]);

  return (
    <div>
      {loggedInUser?.role === UserRole.staff && <Link to={'/admin/users'}>&lt; all users</Link>}
      <h1>User Profile</h1>
      {user && <UserProfile loggedInUser={loggedInUser} user={user} />}
      {bookings.length < 1 && <p>You have not booked any slot yet</p>}
      {upcomingBookings.length > 0 && (
        <>
          <h1>Upcoming bookings</h1>
          <p>
            <b>Please note booking times are in Europe/Helsinki timezone</b>
          </p>
          <BookingList bookingTypes={bookingTypes} bookings={upcomingBookings} />
        </>
      )}
      {pastBookings.length > 0 && (
        <>
          <h1>Past bookings</h1>
          <BookingList bookingTypes={bookingTypes} bookings={pastBookings} defaultSortAsc={false} />
        </>
      )}
    </div>
  );
};

const UserProfile: React.FC<{ loggedInUser: TokenUserData | null; user: ApiUserData }> = ({
  loggedInUser,
  user,
}) => {
  return (
    <div className="flex flex-column">
      <div>
        <span className="font-weight-bold">Full name:</span> {user.fullName}
      </div>
      <div>
        <span className="font-weight-bold">Email:</span> {user.email}
      </div>
      <div>
        <span className="font-weight-bold">Role:</span> {user.role}
      </div>
      <div>
        <span className="font-weight-bold">Created on:</span>{' '}
        {moment(user.created).format('dddd DD/MM/YYYY, HH:mm')}
      </div>
      {loggedInUser?.role === UserRole.staff && (
        <div>
          <span className="font-weight-bold">Notes:</span> {user.userNote || '-'}
        </div>
      )}
    </div>
  );
};

const BookingList: React.FC<{
  bookingTypes: Array<ApiBookingType>;
  bookings: Array<ApiBooking>;
  defaultSortAsc?: boolean;
}> = ({ bookingTypes, bookings, defaultSortAsc }) => {
  const dateSort = (a: { start: string }, b: { start: string }) => {
    return new Date(a.start) > new Date(b.start) ? 1 : -1;
  };

  const getBookingTypeColor = useCallback(
    (id) => {
      return BookingTypeColors[
        bookingTypes.findIndex(({ uuid }) => uuid === id) % Object.keys(BookingTypeColors).length
      ];
    },
    [bookingTypes],
  );

  const columns = [
    {
      id: 1,
      name: 'Type',
      selector: (row: ApiBooking) => row.bookingType.name,
      format: (row: ApiBooking) => (
        <div
          className="padding-xxs border-radius color-white font-weight-bold"
          style={{ background: getBookingTypeColor(row.bookingType.uuid) }}
        >
          {row.bookingType.name}
        </div>
      ),
      wrap: true,
    },
    {
      id: 2,
      name: 'Date',
      selector: (row: ApiBooking) => `${moment(row.start).format('ddd Do MMM YYYY HH:mm')}`,
      sortable: true,
      sortFunction: dateSort,
      wrap: true,
      format: (row: ApiBooking) => {
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
      name: 'Full Name',
      selector: (row: ApiBooking) => row.fullName,
    },
    {
      id: 4,
      name: 'Email',
      selector: (row: ApiBooking) => row.email,
      wrap: true,
      grow: 2,
    },
    {
      id: 5,
      name: 'Phone',
      selector: (row: ApiBooking) => row.phone,
      wrap: true,
    },
    {
      id: 6,
      name: 'Work Location',
      selector: (row: ApiBooking) => (row.workingRemotely ? 'Remote' : 'Office'),
    },
    {
      id: 7,
      name: 'Note',
      selector: (row: ApiBooking) => row.bookingNote,
      wrap: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={bookings}
      defaultSortFieldId={2}
      defaultSortAsc={defaultSortAsc}
      pagination
      responsive
    />
  );
};
