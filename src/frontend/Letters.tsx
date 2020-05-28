import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps, useNavigate } from '@reach/router';

import type { ApiLetterAdmin, ApiUserData } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';
import { useRequest } from './http';

export const Letters: React.FunctionComponent<RouteComponentProps> = () => {
  const [letters, setLetters] = useState<Array<ApiLetterAdmin>>([]);
  const [users, setUsers] = useState<Array<ApiUserData>>([]);
  const { addNotification } = useNotifications();
  const { getRequest, postRequest } = useRequest();
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const usersResult = await getRequest<{ data: Array<ApiUserData> }>(`/api/users`, {
        useJwt: true,
      });
      setUsers(usersResult.data.data);
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to get users' });
      setUsers([]);
    }
  }, [addNotification, getRequest]);

  const fetchLetters = useCallback(async () => {
    try {
      const result = await getRequest<{ data: Array<ApiLetterAdmin> }>(`/api/letters`, {
        useJwt: true,
      });
      setLetters(
        result.data.data.sort(
          (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
        ),
      );
    } catch (err) {
      setLetters([]);
      addNotification({ type: 'error', message: 'Unable to get letters' });
    }
  }, [addNotification, getRequest]);

  const fetchData = useCallback(async () => {
    await fetchUsers();
    await fetchLetters();
  }, [fetchUsers, fetchLetters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignLetter = async ({
    letterUuid,
    assigneeUuid,
  }: {
    letterUuid: string;
    assigneeUuid: string;
  }) => {
    const email = (users.find((u) => u.uuid === assigneeUuid) || {}).email;
    try {
      const result = await postRequest(
        '/api/letters/assign',
        { letterUuid, assigneeUuid },
        { useJwt: true },
      );
      if (result.data.data) {
        addNotification({ type: 'success', message: `Letter was assigned to ${email}` });
      }
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: `Unable to assign letter to ${email}` });
    }
    await fetchLetters();
  };

  return (
    <>
      <h1>Letters</h1>
      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>Title</th>
            <th>Status</th>
            <th>Assigned to</th>
          </tr>
        </thead>
        <tbody>
          {letters.map((letter) => {
            return (
              <tr
                key={`letter-list-item-${letter.uuid}`}
                onClick={() => navigate(`letters/${letter.uuid}`)}
              >
                <td>{new Date(letter.created).toLocaleString()}</td>
                <td>{letter.title}</td>
                <td>{letter.status}</td>
                <td>
                  <select
                    defaultValue={letter.assignedResponderUuid || ''}
                    onClick={(e: React.MouseEvent<HTMLSelectElement>) => {
                      e.stopPropagation();
                    }}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      e.preventDefault();
                      if (e.target.value) {
                        assignLetter({ assigneeUuid: e.target.value, letterUuid: letter.uuid });
                      }
                    }}
                  >
                    <option value="">unassigned</option>;
                    {users.map((u) => {
                      return (
                        <option
                          key={`assign-letter-option-${letter.uuid}-${u.uuid}`}
                          value={u.uuid}
                        >
                          {u.email} {u.fullName && `(${u.fullName})`}
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
