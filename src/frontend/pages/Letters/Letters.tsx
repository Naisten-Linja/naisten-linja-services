import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import styled from 'styled-components';
import Select from 'react-select';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

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
  const { t } = useTranslation(namespaces.pages.letters);

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
      addNotification({ type: 'error', message: t('fetch_users_error') });
      setUsers([]);
    }
  }, [getRequest, addNotification, t]);

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
      addNotification({ type: 'error', message: t('fetch_letters_error') });
    }
  }, [addNotification, getRequest, t]);

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
          addNotification({ type: 'success', message: t('assign_letter_success', { email }) });
        else addNotification({ type: 'success', message: t('unassign_letter_success') });
      }
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: t('assign_letter_error', { email }) });
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
      <h1>{t('table.title')}</h1>
      <LettersTable>
        <thead>
          <tr>
            <th>{t('table.created')}</th>
            <th>{t('table.title')}</th>
            <th>{t('table.reply_status')}</th>
            <th>{t('table.read_receipt')}</th>
            {isStaff && <th>{t('table.assigned_to')}</th>}
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
                        placeholder={t('table.user_select')}
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
