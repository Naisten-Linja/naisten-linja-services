import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';

import { ApiBookingType } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';

export const Booking: React.FunctionComponent<RouteComponentProps> = () => {
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
      <h1>Booking</h1>
      {JSON.stringify(bookingTypes)}
    </>
  );
};

export function isBookableDay(date: Date, bookingType: ApiBookingType): boolean {
  const weekDay = date.getDay();
  return weekDay === undefined
    ? false
    : !bookingType.rules[weekDay]
    ? false
    : bookingType.rules[weekDay].enabled;
}
