import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';

import { ApiBookingType, weekDays } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';

export const BookingTypes: React.FunctionComponent<RouteComponentProps> = () => {
  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingType>>([]);
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingType> }>(
        '/api/booking-types',
        { useJwt: true },
      );
      setBookingTypes(bookingTypesResult.data.data);
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to get all booking types' });
    }
  }, [addNotification, setBookingTypes, getRequest]);

  useEffect(() => {
    fetchBookingTypes();
  }, [fetchBookingTypes]);

  return (
    <>
      <h1>Booking types</h1>
      {JSON.stringify(bookingTypes)}
      {bookingTypes.map((bookingType) => {
        return (
          <div className="container" key={bookingType.uuid}>
            <h3>{bookingType.name}</h3>
            <table className="table-responsive">
              <thead>
                <tr>
                  {weekDays.map((day, idx) => (
                    <th key={idx} style={{ width: `calc(100% / 7)` }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {bookingType.rules.map(({ disabled, slots = [] }, idx) => (
                    <td key={idx}>
                      {disabled
                        ? ''
                        : slots.length > 0
                        ? slots.map((slot, idx) => (
                            <p key={`slot-${idx}`}>
                              {`${slot.start}-${slot.end}. Seats: ${slot.seats}`}
                            </p>
                          ))
                        : ''}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </>
  );
};
