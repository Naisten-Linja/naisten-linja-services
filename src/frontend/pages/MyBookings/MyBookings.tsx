import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import moment from 'moment-timezone';

import { ApiBooking } from '../../../common/constants-common';
import { useRequest } from '../../shared/http';

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
