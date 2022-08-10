import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';

import { ApiBooking, ApiBookingUserStats, ApiUserData, UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import { useRequest } from './http';
import moment from 'moment-timezone';

export const Users: React.FunctionComponent<RouteComponentProps> = () => {
  const [users, setUsers] = useState<Array<ApiUserData>>([]);
  const [bookingStats, setBookingStats] = useState<Array<ApiBookingUserStats>>([]);
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
      const result = await getRequest<{ data: Array<ApiBookingUserStats> }>('/api/bookings/userstats', {
        useJwt: true,
      });
      if (result.data.data) {
        const bookings = result.data.data;
        callback(bookings);
      }
    },
    [getRequest],
  );

  useEffect(() => {
    let updateStateAfterFetch = true;
    fetchBookingStats((bookingStats) => {
      if (bookingStats && updateStateAfterFetch) {
        setBookingStats(bookingStats);
      }
    });
    return () => {
      updateStateAfterFetch = false;
    };
  }, [getRequest, setBookingStats, fetchBookingStats]);

  const usersWithBookings = users.map(user => {
    const emptyStats: ApiBookingUserStats = {
      uuid: user.uuid,
      previousBooking: null,
      upcomingBooking: null,
      totalPrevious: 0,
      totalUpcoming: 0,
    };
    const stats = bookingStats.find(stats => stats.uuid === user.uuid) || emptyStats;
    return { ...user, ...stats };
  })

  const renderBooking = (booking: ApiBooking | null, total: number) => {
    if (booking === null) return <>-</>
    const others = total > 0 ? total - 1 : 0
    return <span>
      {moment(booking.start).format('ddd Do MMM YYYY')}
      <br />
      {moment(booking.start).format('HH:mm')} - {moment(booking.end).format('HH:mm')}
      {others > 0 ? <span style={{ float: 'right' }}>(+{others} more)</span> : null}
    </span>
  }

  return (
    <>
      <h1>Users</h1>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Full name</th>
              <th>Previous booking</th>
              <th>Upcoming booking</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {usersWithBookings.map((u) => {
              return (
                <tr key={`user-list-item-${u.uuid}`}>
                  <td><Link to={u.uuid}>{u.email}</Link></td>
                  <td>{u.fullName}</td>
                  <td>{renderBooking(u.previousBooking, u.totalPrevious)}</td>
                  <td>{renderBooking(u.upcomingBooking, u.totalUpcoming)}</td>
                  <td>
                    <select
                      defaultValue={u.role}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        updateUserRole({
                          uuid: u.uuid,
                          email: u.email,
                          role: e.target.value as UserRole,
                        });
                      }}
                      disabled={loggedInUser !== null && u.uuid === loggedInUser.uuid}
                    >
                      {Object.values(UserRole).map((role) => {
                        return (
                          <option key={`user-role-option-${u.uuid}-${role}`} value={role}>
                            {role}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
