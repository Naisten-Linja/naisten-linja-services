import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import moment from 'moment';

import { ApiBooking } from '../../common/constants-common';
import { useRequest } from '../http';

export const AllBookings: React.FC<RouteComponentProps> = () => {
  const [bookings, setBookings] = useState<Array<ApiBooking>>([]);
  const [refetchBookings, setRefetchBookings] = useState(true);
  const { getRequest, deleteRequest } = useRequest();

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

  const handleDeleteBooking = (bookingUuid: string) => async () => {
    if (window.confirm('Are you sure to delete this booking slot?')) {
      await deleteRequest(`/api/bookings/booking/${bookingUuid}`, { useJwt: true });
      const result = await getRequest<{ data: Array<ApiBooking> }>('/api/bookings/all', {
        useJwt: true,
      });
      setBookings(
        result.data.data.sort((a, b) => (new Date(a.start) > new Date(b.start) ? -1 : 1)),
      );
    }
  };

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
            <th></th>
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
              <td>
                <button
                  className="button button-xxs button-border button-error"
                  onClick={handleDeleteBooking(uuid)}
                >
                  Delete
                </button>{' '}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
