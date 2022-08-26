import React, { useEffect, useState } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import DataTable from 'react-data-table-component';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import { useRequest } from '../../shared/http';
import {
  ApiBookingWithColor,
  ApiUserData,
  TokenUserData,
  UserRole,
} from '../../../common/constants-common';
import moment from 'moment';
import { useAuth } from '../../AuthContext';

export const Profile: React.FunctionComponent<RouteComponentProps<{ userUuid: string }>> = ({
  userUuid,
}) => {
  const { t } = useTranslation(namespaces.pages.profile);

  const { user: loggedInUser } = useAuth();

  const [bookings, setBookings] = useState<Array<ApiBookingWithColor>>([]);
  const [user, setUser] = useState<ApiUserData>();
  const upcomingBookings = bookings.filter(({ end }) => new Date() < new Date(end));
  const pastBookings = bookings.filter(({ end }) => new Date() >= new Date(end));

  const { getRequest } = useRequest();

  useEffect(() => {
    let updateStateAfterFetch = true;
    const getUserProfile = async () => {
      const result = await getRequest<{ data: ApiUserData }>(`/api/profile/${userUuid}`, {
        useJwt: true,
      });
      if (result.data.data && updateStateAfterFetch) {
        setUser(result.data.data);
      }
    };
    getUserProfile();
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setUser, userUuid]);

  useEffect(() => {
    let updateStateAfterFetch = true;
    const getBookings = async () => {
      const result = await getRequest<{ data: Array<ApiBookingWithColor> }>(
        `/api/bookings/user/${userUuid}`,
        {
          useJwt: true,
        },
      );
      if (result.data.data && updateStateAfterFetch) {
        setBookings(result.data.data);
      }
    };
    getBookings();
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setBookings, userUuid]);

  return (
    <div>
      {loggedInUser?.role === UserRole.staff && <Link to={'/admin/users'}>&lt; {t('back_link')}</Link>}
      <h1>{t('title')}</h1>
      {user && <UserProfile loggedInUser={loggedInUser} user={user} />}
      {bookings.length < 1 && <p>{t('no_booking')}</p>}
      {upcomingBookings.length > 0 && (
        <>
          <h1>{t('upcoming_bookings.title')}</h1>
          <p>
            <b>{t('upcoming_bookings.p_1')}</b>
          </p>
          <BookingList bookings={upcomingBookings} />
        </>
      )}
      {pastBookings.length > 0 && (
        <>
          <h1>{t('past_bookings.title')}</h1>
          <BookingList bookings={pastBookings} defaultSortAsc={false} />
        </>
      )}
    </div>
  );
};

const UserProfile: React.FC<{ loggedInUser: TokenUserData | null; user: ApiUserData }> = ({
  loggedInUser,
  user,
}) => {
  const { t } = useTranslation(namespaces.pages.profile);

  return (
    <div className="flex flex-column">
      <div>
        <span className="font-weight-bold">{t('user_profile.fullname')}:</span> {user.fullName}
      </div>
      <div>
        <span className="font-weight-bold">{t('user_profile.email')}:</span> {user.email}
      </div>
      <div>
        <span className="font-weight-bold">{t('user_profile.role')}:</span> {user.role}
      </div>
      <div>
        <span className="font-weight-bold">{t('user_profile.created_on')}:</span>{' '}
        {moment(user.created).format('dddd DD/MM/YYYY, HH:mm')}
      </div>
      {loggedInUser?.role === UserRole.staff && (
        <div>
          <span className="font-weight-bold">{t('user_profile.notes')}:</span> {user.userNote || '-'}
        </div>
      )}
    </div>
  );
};

const BookingList: React.FC<{
  bookings: Array<ApiBookingWithColor>;
  defaultSortAsc?: boolean;
}> = ({ bookings, defaultSortAsc }) => {
  const { t } = useTranslation(namespaces.pages.profile);

  const dateSort = (a: { start: string }, b: { start: string }) => {
    return new Date(a.start) > new Date(b.start) ? 1 : -1;
  };

  const columns = [
    {
      id: 1,
      name: t('booking.type'),
      selector: (row: ApiBookingWithColor) => row.bookingType.name,
      format: (row: ApiBookingWithColor) => (
        <div
          className="padding-xxs border-radius color-white font-weight-bold"
          style={{ background: row.bookingType.color }}
        >
          {row.bookingType.name}
        </div>
      ),
      wrap: true,
    },
    {
      id: 2,
      name: t('booking.date'),
      selector: (row: ApiBookingWithColor) =>
        `${moment(row.start).format('ddd Do MMM YYYY HH:mm')}`,
      sortable: true,
      sortFunction: dateSort,
      wrap: true,
      format: (row: ApiBookingWithColor) => {
        return (
          <>
            {moment(row.start).format('ddd Do MMM YYYY')}
            <br />
            {moment(row.start).format('HH:mm')} - {moment(row.end).format('HH:mm')}
          </>
        );
      },
    },
    {
      id: 3,
      name: t('booking.fullname'),
      selector: (row: ApiBookingWithColor) => row.fullName,
    },
    {
      id: 4,
      name: t('booking.email'),
      selector: (row: ApiBookingWithColor) => row.email,
      wrap: true,
      grow: 2,
    },
    {
      id: 5,
      name: t('booking.phone'),
      selector: (row: ApiBookingWithColor) => row.phone,
      wrap: true,
    },
    {
      id: 6,
      name: t('booking.work_location'),
      selector: (row: ApiBookingWithColor) => (row.workingRemotely ? t('booking.remote') : t('booking.office')),
    },
    {
      id: 7,
      name: t('booking.notes'),
      selector: (row: ApiBookingWithColor) => row.bookingNote,
      wrap: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={bookings}
      defaultSortFieldId={2}
      defaultSortAsc={defaultSortAsc}
      pagination
      responsive
    />
  );
};
