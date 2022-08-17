import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import { Formik, Field, Form } from 'formik';
import DataTable, { TableColumn } from 'react-data-table-component';
import moment from 'moment-timezone';
import Select from 'react-select';
import { IoMdCopy } from 'react-icons/io';
import copy from 'copy-to-clipboard';

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
import { OverrideTurretInputHeightForReactSelectDiv, StyledDataTableWrapperDiv } from './utils-frontend';

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
      const i = users.findIndex((u) => u.uuid === uuid);
      const usersUpdated = [...users];
      usersUpdated[i].role = role;
      setUsers(usersUpdated);

      addNotification({ type: 'success', message: `Updated ${email} role to ${role}` });
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: `Failed to update ${email} role to ${role}` });
    }
  };

  const fetchUsers = useCallback(
    async (callback: (allUsers: Array<ApiUserData>) => void) => {
      try {
        const result = await getRequest<{ data: Array<ApiUserData> }>(`/api/users`, {
          useJwt: true,
        });
        const data = result.data.data;
        setUsers(data);
        callback(data);
      } catch (err) {
        console.log(err);
        setUsers([]);
      }
    },
    [getRequest],
  );

  useEffect(() => {
    let updateStateAfterFetch = true;
    fetchUsers((users) => {
      if (users && updateStateAfterFetch) {
        setUsers(users);
      }
    });
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setUsers, fetchUsers]);

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
    });
    setUsersWithBookings(userStats);
  }, [users, bookingStats]);

  const copyEmailsToClipboard = useCallback(() => {
    const success = copy(
      usersWithBookings.map(u => u.email).join(","),
      { format: 'text/plain' }
    );
    if (success) {
      addNotification({ type: 'success', message: 'Emails of all users copied to your clipboard' });
    } else {
      addNotification({ type: 'error', message: 'Failed to copy user emails' });
    }
  }, [usersWithBookings, addNotification]);

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
  };

  const columns: TableColumn<UserDataStats>[] = [
    {
      id: 1,
      name: <>
        <span style={{ flex: 1 }}>Email</span>
        <button onClick={copyEmailsToClipboard} className="button button-square button-xxs button-icon">
          <span>Copy all emails</span>
          <IoMdCopy aria-hidden={true}></IoMdCopy>
        </button>
      </>,
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
      name: 'Phone number',
      selector: (row: UserDataStats) => {
        if (row.upcomingBooking) return row.upcomingBooking.phone;
        if (row.previousBooking) return row.previousBooking.phone;
        return '-';
      },
    },
    {
      id: 4,
      name: 'Previous booking',
      selector: () => '', // next row here overrides this
      format: (row: UserDataStats) => renderBooking(row.previousBooking, row.totalPrevious),
      sortable: true,
      sortFunction: (a, b) => sortDate(a.previousBooking, b.previousBooking, 'history'),
    },
    {
      id: 5,
      name: 'Upcoming booking',
      selector: () => '', // next row here overrides this
      format: (row: UserDataStats) => renderBooking(row.upcomingBooking, row.totalUpcoming),
      sortable: true,
      sortFunction: (a, b) => sortDate(a.upcomingBooking, b.upcomingBooking, 'future'),
    },
    {
      id: 6,
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
    {
      id: 7,
      name: 'Notes',
      selector: (row: UserDataStats) => row.userNote,
      format: (row: UserDataStats) => (
        <UpdateUserNoteForm
          userNote={row.userNote}
          userUuid={row.uuid}
          fetchUsers={fetchUsers}
          setUsers={setUsers}
        />
      ),
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
      <StyledDataTableWrapperDiv>
        <DataTable columns={columns} data={usersWithBookings} defaultSortFieldId={2} responsive/>
      </StyledDataTableWrapperDiv>
    </>
  );
};

type UpdateUserNoteFormProps = {
  userUuid: string;
  userNote: string;
  fetchUsers: (callback: (users: Array<ApiUserData>) => void) => Promise<void>;
  setUsers: (users: Array<ApiUserData>) => void;
};

const UpdateUserNoteForm: React.FC<UpdateUserNoteFormProps> = ({
  userUuid,
  userNote,
  fetchUsers,
  setUsers,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { addNotification } = useNotifications();
  const { putRequest } = useRequest();

  const updateUserNote = useCallback(
    async (note: string) => {
      try {
        const result = await putRequest<{ data: ApiUserData }>(
          `/api/users/${userUuid}/note`,
          {
            userNote: note,
          },
          { useJwt: true },
        );
        if (result.data.data) {
          addNotification({ type: 'success', message: 'User note was updated' });
          fetchUsers((users) => {
            setUsers(users);
          });
        }
      } catch (err) {
        addNotification({ type: 'error', message: 'Failed to update user note' });
      } finally {
        setIsEditing(false);
      }
    },
    [putRequest, userUuid, addNotification, fetchUsers, setUsers],
  );

  const initialFormValues = {
    userNote,
  };

  if (!isEditing) {
    return (
      <>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{userNote}</pre>
        <button
          className="button button-xxs"
          onClick={() => {
            setIsEditing(true);
          }}
        >
          Edit
        </button>
      </>
    );
  }

  return (
    <Formik
      initialValues={initialFormValues}
      onSubmit={({ userNote }) => {
        updateUserNote(userNote);
      }}
    >
      <Form>
        <Field type="text" name="userNote" as="textarea" aria-label="User note" />
        <input
          type="submit"
          className="button button-xxs button-primary"
          value="Save"
        />
        <button type="button" className="button button-xxs" onClick={() => setIsEditing(false)}>
          Cancel
        </button>
      </Form>
    </Formik>
  );
};
