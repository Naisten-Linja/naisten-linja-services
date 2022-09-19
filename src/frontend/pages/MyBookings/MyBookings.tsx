import React, { useState, useEffect } from 'react';
import moment from 'moment-timezone';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import { ApiBooking } from '../../../common/constants-common';
import { useRequest } from '../../shared/http';

export const MyBookings: React.FC = () => {
  const { t } = useTranslation(namespaces.pages.myBookings);

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
      {bookings.length < 1 && <p>{t('no_booking')}</p>}
      {upcomingBookings.length > 0 && (
        <>
          <h1>{t('upcoming_bookings')}</h1>
          <p>
            <b>{t('p_1')}</b>
          </p>
          <BookingList bookings={upcomingBookings} />
        </>
      )}
      {pastBookings.length > 0 && (
        <>
          <h1>{t('past_bookings')}</h1>
          <BookingList bookings={pastBookings} />
        </>
      )}
    </div>
  );
};

const BookingList: React.FC<{ bookings: Array<ApiBooking> }> = ({ bookings }) => {
  const { t } = useTranslation(namespaces.pages.myBookings);

  return (
    <div className="table-responsive">
      <table>
        <thead>
          <tr>
            <th>{t('table.booking_detail')}</th>
            <th>{t('table.personal_detail')}</th>
            <th>{t('table.notes')}</th>
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
                  {t('table.work_location')}:{' '}
                  {workingRemotely ? t('table.remote') : t('table.office')}
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
