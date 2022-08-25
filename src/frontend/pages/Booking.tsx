import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';

import { ApiBookingTypeWithColor } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';
import { BookingCalendar } from '../BookingCalendar/BookingCalendar';

export const Booking: React.FunctionComponent<RouteComponentProps> = () => {
  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingTypeWithColor>>([]);
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingTypeWithColor> }>(
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

  return <BookingCalendar bookingTypes={bookingTypes} />;
};

export function isBookableDay(date: Date, bookingType: ApiBookingTypeWithColor): boolean {
  const weekDay = date.getDay();
  return weekDay === undefined
    ? false
    : !bookingType.rules[weekDay]
    ? false
    : bookingType.rules[weekDay].enabled;
}
