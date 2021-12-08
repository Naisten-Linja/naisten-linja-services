import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import moment from 'moment';

import { ApiBooking } from '../../common/constants-common';
import { useRequest } from '../http';

export const AllBookings: React.FC<RouteComponentProps> = () => {
  const [bookings, setBookings] = useState<Array<ApiBooking>>([]);
  const { getRequest } = useRequest();

  useEffect(() => {
    let updateStateAfterFetch = true;
    const getBookings = async () => {
      const result = await getRequest<{ data: Array<ApiBooking> }>('/api/bookings/all', {
        useJwt: true,
      });
      if (result.data.data && updateStateAfterFetch) {
        setBookings(
          result.data.data.sort((a, b) => (new Date(a.start) > new Date(b.start) ? -1 : 1)),
        );
      }
    };

    getBookings();

    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setBookings]);

  return (
    <div className="width-100">
      <h1>Manage bookings</h1>
      <table className="table-responsive">
        <thead>
          <tr>
            <th>Type</th>
            <th>Date</th>
            <th>Slot time</th>
            <th>Booking details</th>
            <th>User email</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(({ uuid, end, start, fullName, phone, email, bookingType, user }) => (
            <tr key={uuid}>
              <td>{bookingType.name}</td>
              <td>{moment(start).format('DD.MM.YYYY')}</td>
              <td>
                {moment(start).format('HH:mm')} - {moment(end).format('HH:mm')}
              </td>
              <td>
                {fullName}
                <br />
                {email}
                <br />
                {phone}
              </td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
