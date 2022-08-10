import React, { useEffect, useState } from 'react';
import { RouteComponentProps, Link } from '@reach/router';

import { useRequest } from './http';
import { ApiBooking, ApiUserData, UserRole } from '../common/constants-common';
import moment from 'moment';
import { useAuth } from './AuthContext';

export const Profile: React.FunctionComponent<RouteComponentProps<{ userUuid: string }>> = ({
  userUuid,
}) => {
  const { user: loggedInUser } = useAuth();

  const [bookings, setBookings] = useState<Array<ApiBooking>>([]);
  const [user, setUser] = useState<ApiUserData>();
  const { getRequest } = useRequest();
  const upcomingBookings = bookings.filter(({ end }) => new Date() < new Date(end));
  const pastBookings = bookings.filter(({ end }) => new Date() >= new Date(end));

  useEffect(() => {
    let updateStateAfterFetch = true;
    const getUserProfile = async () => {
      const result = await getRequest<{ data: ApiUserData }>(`/api/profile/${userUuid}`, {
        useJwt: true,
      });
      if (result.data.data && updateStateAfterFetch) {
        console.log('user:', result.data.data);
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
        setBookings(
          result.data.data.sort((a, b) => (new Date(a.start) > new Date(b.start) ? 1 : -1)),
        );
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
      {user && <UserProfile user={user} />}
      {bookings.length < 1 && <p>You have not booked any slot yet</p>}
      {upcomingBookings.length > 0 && (
        <>
          <h1>Upcoming bookings</h1>
          <p>
            <b>Please note booking times are in Europe/Helsinki timezone</b>
          </p>
          <BookingList bookings={upcomingBookings} />
        </>
      )}
      {pastBookings.length > 0 && (
        <>
          <h1>Past bookings</h1>
          <BookingList bookings={pastBookings} />
        </>
      )}
    </div>
  );
};

const UserProfile: React.FC<{ user: ApiUserData }> = ({ user }) => {
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
    </div>
  );
};

const BookingList: React.FC<{ bookings: Array<ApiBooking> }> = ({ bookings }) => {
  return (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Booking details</th>
            <th>Personal details</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(
            ({
              uuid,
              bookingType,
              bookingNote,
              start,
              end,
              fullName,
              email,
              phone,
              workingRemotely,
            }) => (
              <tr key={uuid}>
                <td>
                  <b>{bookingType.name}</b>
                  <br />
                  {moment(start).format('ddd Do MMM YYYY')}
                  <br />
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
                  {!!bookingNote && (
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {bookingNote}
                    </pre>
                  )}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
};
