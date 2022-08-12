import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import moment from 'moment-timezone';
import Select from 'react-select';

import {
  ApiBooking,
  ApiBookingType,
  ApiBookingUserStats,
  ApiUserData,
  UserRole,
} from '../common/constants-common';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import { useRequest } from './http';
import { OverrideTurretInputHeightForReactSelectDiv } from './utils-frontend';

import DataTable, { TableColumn } from 'react-data-table-component';
type UserDataStats = ApiUserData & ApiBookingUserStats;

export const Users: React.FunctionComponent<RouteComponentProps> = () => {
  type BookingTypeOption = { label: string; value: string | null };
  const ALL_TYPES_OPTION = { label: '(All booking types)', value: null };

  const [users, setUsers] = useState<Array<ApiUserData>>([]);
  const [bookingStats, setBookingStats] = useState<Array<ApiBookingUserStats> | null>(null);
  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingType>>([]);
  const [currBookingType, setCurrBookingType] = useState<BookingTypeOption>(ALL_TYPES_OPTION);
  const [usersWithBookings, setUsersWithBookings] = useState<Array<UserDataStats>>([]);
  const { user: loggedInUser } = useAuth();
  const { addNotification } = useNotifications();
  const { getRequest, putRequest } = useRequest();

  const updateUserRole = async ({
    email,
    uuid,
    role,
  }: {
    email: string;
    uuid: string;
    role: UserRole;
  }) => {
    try {
      await putRequest(`/api/users/${uuid}/role`, { role }, { useJwt: true });
      
      // Update the state
      const i = users.findIndex(u => u.uuid === uuid);
      const usersUpdated = [...users]
      usersUpdated[i].role = role;
      setUsers(usersUpdated);

      addNotification({ type: 'success', message: `Updated ${email} role to ${role}` });
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: `Failed to update ${email} role to ${role}` });
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getRequest<{ data: Array<ApiUserData> }>(`/api/users`, {
          useJwt: true,
        });
        setUsers(result.data.data);
      } catch (err) {
        console.log(err);
        setUsers([]);
      }
    };
    fetchUsers();
  }, [getRequest]);

  const fetchBookingStats = useCallback(
    async (callback: (bookingStats: Array<ApiBookingUserStats>) => void) => {
      const result = await getRequest<{ data: Array<ApiBookingUserStats> }>(
        '/api/bookings/userstats',
        {
          useJwt: true,
          params: {
            bookingType: currBookingType.value, // if null, the param will disappear
          },
        },
      );
      if (result.data.data) {
        const bookings = result.data.data;
        callback(bookings);
      }
    },
    [getRequest, currBookingType.value],
  );

  useEffect(() => {
    let updateStateAfterFetch = true;
    setBookingStats(null);
    fetchBookingStats((bookingStats) => {
      if (bookingStats && updateStateAfterFetch) {
        setBookingStats(bookingStats);
      }
    });
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setBookingStats, fetchBookingStats]);

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingType> }>(
        '/api/booking-types',
        { useJwt: true },
      );
      const result = bookingTypesResult.data.data;
      setBookingTypes(result);
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to get all booking types' });
    }
  }, [addNotification, setBookingTypes, getRequest]);

  useEffect(() => {
    fetchBookingTypes();
  }, [fetchBookingTypes]);

  useEffect(() => {
    const userStats = users.map((user) => {
      const emptyStats: ApiBookingUserStats = {
        uuid: user.uuid,
        previousBooking: null,
        upcomingBooking: null,
        totalPrevious: 0,
        totalUpcoming: 0,
      };
      const stats = bookingStats?.find((stats) => stats.uuid === user.uuid) || emptyStats;
      return { ...user, ...stats };
    })
    setUsersWithBookings(userStats);
  }, [users, bookingStats])

  const bookingTypeOptions: Array<BookingTypeOption> = [
    ALL_TYPES_OPTION,
    ...bookingTypes.map((b) => ({
      label: b.name,
      value: b.uuid,
    })),
  ];

  const renderBooking = (booking: ApiBooking | null, total: number) => {
    if (booking === null) return <>-</>;
    const others = total > 0 ? total - 1 : 0;
    return (
      <span>
        {moment(booking.start).format('ddd Do MMM YYYY')}
        <br />
        {moment(booking.start).format('HH:mm')} - {moment(booking.end).format('HH:mm')}
        {others > 0 ? <span style={{ float: 'right' }}>(+{others} more)</span> : null}
      </span>
    );
  };

  const sortDate = (a: ApiBooking | null, b: ApiBooking | null, showNullValuesIn: 'history' | 'future') => {
    const nullFallback = (showNullValuesIn === 'history')
      ? new Date(0)
      : new Date(10000000000000);
    const dateA = a ? new Date(a.start) : nullFallback;
    const dateB = b ? new Date(b.start) : nullFallback;
    return dateA > dateB ? 1 : -1;
  }

  const columns: TableColumn<UserDataStats>[] = [
    {
      id: 1,
      name: 'Email',
      selector: (row: UserDataStats) => row.email,
      format: (row: UserDataStats) => <Link to={row.uuid}>{row.email}</Link>,
      wrap: true,
      grow: 2,
    },
    {
      id: 2,
      name: 'Full Name',
      selector: (row: UserDataStats) => row.fullName || '',
      sortable: true,
    },
    {
      id: 3,
      name: 'Previous booking',
      selector: () => '', // next row here overrides this
      format: (row: UserDataStats) => renderBooking(row.previousBooking, row.totalPrevious),
      sortable: true,
      sortFunction: (a, b) => sortDate(a.previousBooking, b.previousBooking, 'history'),
    },
    {
      id: 4,
      name: 'Upcoming booking',
      selector: () => '', // next row here overrides this
      format: (row: UserDataStats) => renderBooking(row.upcomingBooking, row.totalUpcoming),
      sortable: true,
      sortFunction: (a, b) => sortDate(a.upcomingBooking, b.upcomingBooking, 'future'),
    },
    {
      id: 5,
      name: 'Role',
      selector: (row: UserDataStats) => row.role,
      format: (row: UserDataStats) => {
        return (
          <select
            value={row.role}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              updateUserRole({
                uuid: row.uuid,
                email: row.email,
                role: e.target.value as UserRole,
              });
            }}
            disabled={loggedInUser !== null && row.uuid === loggedInUser.uuid}
          >
            {Object.values(UserRole).map((role) => {
              return (
                <option key={`user-role-option-${row.uuid}-${role}`} value={role}>
                  {role}
                </option>
              );
            })}
          </select>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex justify-content-space-between flex-wrap">
        <h1>Users</h1>
        <OverrideTurretInputHeightForReactSelectDiv className="box-shadow-l padding-s display-inline-block">
          <label htmlFor="user-list-booking-type-select">Only show bookings with type</label>
          <Select
            id="user-list-booking-type-select"
            isSearchable
            isLoading={bookingStats === null}
            value={currBookingType}
            options={bookingTypeOptions}
            onChange={(opt) => setCurrBookingType(opt || ALL_TYPES_OPTION)}
          />
        </OverrideTurretInputHeightForReactSelectDiv>
      </div>
      <DataTable columns={columns} data={usersWithBookings} defaultSortFieldId={2} responsive/>
    </>
  );
};
