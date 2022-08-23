import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import styled from 'styled-components';
import Select from 'react-select';

import {
  ApiLetterAdmin,
  ApiLetterWithReadStatus,
  ApiUserData,
  UserRole,
} from '../../../common/constants-common';
import { useNotifications } from '../../NotificationsContext';
import { useAuth } from '../../AuthContext';
import { useRequest } from '../../shared/http';

import moment from 'moment-timezone';
import { OverrideTurretInputHeightForReactSelectDiv } from '../../shared/utils-frontend';

const LettersTable = styled.table`
  tr {
    height: 4rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const Letters: React.FunctionComponent<RouteComponentProps> = () => {
  const [letters, setLetters] = useState<Array<ApiLetterWithReadStatus>>([]);
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
      const result = await getRequest<{ data: Array<ApiLetterWithReadStatus> }>(`/api/letters`, {
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
    assigneeUuid: string | null;
  }) => {
    const email = (users.find((u) => u.uuid === assigneeUuid) || {}).email;
    try {
      const result = await postRequest<{ data: Array<ApiLetterAdmin> }>(
        '/api/letters/assign',
        { letterUuid, assigneeUuid },
        { useJwt: true },
      );

      if (result.data.data) {
        if (assigneeUuid)
          addNotification({ type: 'success', message: `Letter was assigned to ${email}` });
        else addNotification({ type: 'success', message: `Letter was unassigned to any email` });
      }
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: `Unable to assign letter to ${email}` });
    }
    await fetchLetters();
  };

  type OptionType = {
    value: string | null;
    label: string;
  };

  const assigneeOptions: OptionType[] = users
    .map((u) => ({
      value: u.uuid as string | null,
      label: `${u.fullName ? u.fullName + ' - ' : ''}${u.email}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleUserSelection = (letter: ApiLetterAdmin, opt: OptionType | null) => {
    if (opt && opt.value !== letter.assignedResponderUuid) {
      assignLetter({ letterUuid: letter.uuid, assigneeUuid: opt.value });
    } else {
      // Unassigned letter will set assigneeUuid field to null
      assignLetter({ letterUuid: letter.uuid, assigneeUuid: null });
    }
  };

  return (
    <>
      <h1>Letters</h1>
      <LettersTable>
        <thead>
          <tr>
            <th>Created</th>
            <th>Title</th>
            <th>Reply status</th>
            <th>Read receipt</th>
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
                <td>
                  {letter.replyReadTimestamp
                    ? moment(letter.replyReadTimestamp).format('dddd DD/MM/YYYY, HH:mm')
                    : '-'}
                </td>
                {isStaff && (
                  <td style={{ maxWidth: 200 }}>
                    <OverrideTurretInputHeightForReactSelectDiv>
                      <Select
                        value={
                          assigneeOptions
                            ? assigneeOptions.find(
                                (option) => option.value === letter.assignedResponderUuid,
                              )
                            : null
                        }
                        placeholder="Assign to a user"
                        options={assigneeOptions}
                        isSearchable
                        isClearable
                        onChange={(selected) => {
                          handleUserSelection(letter, selected);
                        }}
                      />
                    </OverrideTurretInputHeightForReactSelectDiv>
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
