import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import styled from 'styled-components';
// eslint-disable-next-line
import SelectSearch from 'react-select-search';

import { ApiLetterAdmin, ApiUserData, UserRole } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';
import { useAuth } from './AuthContext';
import { useRequest } from './http';

import './assets/react-select-search.css';
import moment from 'moment-timezone';

const LettersTable = styled.table`
  tr {
    height: 4rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const Letters: React.FunctionComponent<RouteComponentProps> = () => {
  const [letters, setLetters] = useState<Array<ApiLetterAdmin>>([]);
  const [users, setUsers] = useState<Array<ApiUserData>>([]);
  const { addNotification } = useNotifications();
  const { getRequest, postRequest } = useRequest();
  const { user } = useAuth();
  const isStaff = user && user.role === UserRole.staff;

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
  }, [getRequest, addNotification]);

  const fetchLetters = useCallback(async () => {
    try {
      const result = await getRequest<{ data: Array<ApiLetterAdmin> }>(`/api/letters`, {
        useJwt: true,
      });
      setLetters(
        result.data.data.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
        ),
      );
    } catch (err) {
      setLetters([]);
      addNotification({ type: 'error', message: 'Unable to get letters' });
    }
  }, [addNotification, getRequest]);

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === UserRole.staff) {
        await fetchUsers();
      }
      await fetchLetters();
    };
    fetchData();
  }, [fetchLetters, fetchUsers, user]);

  const assignLetter = async ({
    letterUuid,
    assigneeUuid,
  }: {
    letterUuid: string;
    assigneeUuid: string;
  }) => {
    const email = (users.find((u) => u.uuid === assigneeUuid) || {}).email;
    try {
      const result = await postRequest<{ data: Array<ApiLetterAdmin> }>(
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

  const assigneeOptions = users.map((u) => ({
    name: `${u.email}${u.fullName ? ' - ' + u.fullName : ''}`,
    value: u.uuid as string | null,
  }));

  return (
    <>
      <h1>Letters</h1>
      <LettersTable>
        <thead>
          <tr>
            <th>Created</th>
            <th>Title</th>
            <th>Reply status</th>
            {isStaff && <th>Assigned to</th>}
          </tr>
        </thead>
        <tbody>
          {letters.map((letter) => {
            return (
              <tr key={`letter-list-item-${letter.uuid}`}>
                <td>{moment(letter.created).format('dddd DD/MM/YYYY, HH:mm')}</td>
                <td>
                  <Link to={letter.uuid}>{letter.title}</Link>
                </td>
                <td>{letter.replyStatus || ''}</td>
                {isStaff && (
                  <td>
                    <SelectSearch
                      options={assigneeOptions}
                      value={letter.assignedResponderUuid}
                      placeholder="Assign to a user"
                      search
                      onChange={(assigneeUuid: string) => {
                        if (assigneeUuid !== letter.assignedResponderUuid) {
                          assignLetter({ letterUuid: letter.uuid, assigneeUuid });
                        }
                      }}
                    />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </LettersTable>
    </>
  );
};
