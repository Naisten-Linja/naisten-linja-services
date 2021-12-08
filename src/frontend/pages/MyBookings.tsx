import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import moment from 'moment';

import { ApiBooking } from '../../common/constants-common';
import { useRequest } from '../http';

export const MyBookings: React.FC<RouteComponentProps> = () => {
  const [bookings, setBookings] = useState<Array<ApiBooking>>([]);
  const { getRequest } = useRequest();
  const upcomingBookings = bookings.filter(({ end }) => new Date() < new Date(end));
  const pastBookings = bookings.filter(({ end }) => new Date() >= new Date(end));

  useEffect(() => {
    let updateStateAfterFetch = true;
    const getBookings = async () => {
      const result = await getRequest<{ data: Array<ApiBooking> }>('/api/bookings', {
        useJwt: true,
      });
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
  }, [getRequest, setBookings]);

  return (
    <div>
      {bookings.length < 1 && <p>You have not booked any slot yet</p>}
      {upcomingBookings.length > 0 && (
        <>
          <h1>Upcoming bookings</h1>
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

const BookingList: React.FC<{ bookings: Array<ApiBooking> }> = ({ bookings }) => {
  return (
    <table className="table-responsive">
      <thead>
        <tr>
          <th>Booking details</th>
          <th>Personal details</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map(({ uuid, bookingType, bookingNote, start, end, fullName, email, phone }) => (
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
            </td>
            <td>
              {!!bookingNote && (
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{bookingNote}</pre>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
