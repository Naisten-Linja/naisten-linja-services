import React, { useState, useEffect, useCallback } from 'react';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import { ApiBookingTypeWithColor, BookingTypeDailyRules } from '../../../common/constants-common';
import { useRequest } from '../../shared/http';
import { useNotifications } from '../../NotificationsContext';
import { BookingCalendar } from './BookingCalendar/BookingCalendar';

export const Booking: React.FC = () => {
  const { t } = useTranslation(namespaces.pages.bookingCalendar);

  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingTypeWithColor>>([]);
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingTypeWithColor> }>(
        '/api/booking-types',
        { useJwt: true },
      );
      const bookingTypes = bookingTypesResult.data.data.map((bookingType) => {
        // Re-shuffle rules so that the first index slot config is Monday,
        // and last slot index is Sunday. This is to match the Finnish convention
        // of having Monday as the first day of the week
        bookingType.rules = [
          ...bookingType.rules.slice(1),
          bookingType.rules[0],
        ] as BookingTypeDailyRules;
        return bookingType;
      });
      setBookingTypes(bookingTypes);
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: t('booking.fetch_booking_types_error') });
    }
  }, [getRequest, addNotification, t]);

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
