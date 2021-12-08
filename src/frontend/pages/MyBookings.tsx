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
          <h1>Upcomping bookings</h1>
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
    <div className="width-100">
      {bookings.map(({ uuid, bookingType, start, end }) => (
        <p key={uuid}>
          <b>{bookingType.name}</b>
          <br />
          Date: {moment(start).format('DD MMMM YYYY')}
          <br />
          Time: {moment(start).format('HH:mm')} - {moment(end).format('HH:mm')}
        </p>
      ))}
    </div>
  );
};
