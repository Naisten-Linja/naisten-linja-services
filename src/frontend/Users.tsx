import React, { useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';

import { ApiUserData, UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import { useRequest } from './http';

export const Users: React.FunctionComponent<RouteComponentProps> = () => {
  const [users, setUsers] = useState<Array<ApiUserData>>([]);
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
    try {
      const fetchUsers = async () => {
        const result = await getRequest<{ data: Array<ApiUserData> }>(`/api/users`, {
          useJwt: true,
        });
        setUsers(result.data.data);
      };
      fetchUsers();
    } catch (err) {
      console.log(err);
      setUsers([]);
    }
  }, [getRequest]);

  return (
    <>
      <h1>Users</h1>
      <table className="table-responsive">
        <thead>
          <tr>
            <th>Email</th>
            <th>Full name</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            return (
              <tr key={`user-list-item-${u.uuid}`}>
                <td>{u.email}</td>
                <td>{u.fullName}</td>
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
    </>
  );
};
