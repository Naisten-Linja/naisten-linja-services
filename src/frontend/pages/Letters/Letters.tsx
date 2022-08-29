import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps, Link } from '@reach/router';
import styled from 'styled-components';
import Select from 'react-select';
import DataTable, { TableColumn } from 'react-data-table-component';
import moment from 'moment-timezone';

import {
  ApiLetterAdmin,
  ApiLetterWithReadStatus,
  ApiUserData,
  UserRole,
} from '../../../common/constants-common';
import { useNotifications } from '../../NotificationsContext';
import { useAuth } from '../../AuthContext';
import { useRequest } from '../../shared/http';
import { OverrideTurretInputHeightForReactSelectDiv } from '../../shared/utils-frontend';

export const Letters: React.FunctionComponent<RouteComponentProps> = () => {
  const [letters, setLetters] = useState<Array<ApiLetterWithReadStatus>>([]);
  const [users, setUsers] = useState<Array<ApiUserData>>([]);
  const { addNotification } = useNotifications();
  const { getRequest, postRequest } = useRequest();
  const { user } = useAuth();
  const isStaff = user ? user.role === UserRole.staff : false;

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
      if (isStaff) {
        await fetchUsers();
      }
      await fetchLetters();
    };
    fetchData();
  }, [fetchLetters, fetchUsers, isStaff]);

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

  return (
    <>
      <h1>Letters</h1>
      <LetterList
        letters={letters}
        users={users}
        showAssignmentColumn={isStaff}
        assignLetter={assignLetter}
      />
    </>
  );
};

const SelectWrapper = styled(OverrideTurretInputHeightForReactSelectDiv)`
  width: 100%;
`;

type LetterListProps = {
  letters: Array<ApiLetterWithReadStatus>;
  users: Array<ApiUserData>;
  showAssignmentColumn: boolean;
  assignLetter: (details: { letterUuid: string; assigneeUuid: string | null }) => Promise<void>;
};

const LetterList = ({ letters, users, showAssignmentColumn, assignLetter }: LetterListProps) => {
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

  const sortDate =
    (key: 'created' | 'replyReadTimestamp') =>
    (a: ApiLetterWithReadStatus, b: ApiLetterWithReadStatus) => {
      const valueA = a[key] || 0;
      const valueB = b[key] || 0;
      const dateA = new Date(valueA);
      const dateB = new Date(valueB);
      return dateA > dateB ? 1 : -1;
    };

  const sortAssigneeName = (a: ApiLetterWithReadStatus, b: ApiLetterWithReadStatus) => {
    return (a.assignedResponderFullName || '').localeCompare(b.assignedResponderFullName || '');
  };

  const columns: TableColumn<ApiLetterWithReadStatus>[] = [
    {
      id: 1,
      name: 'Created',
      selector: (letter) => moment(letter.created).format('dddd DD/MM/YYYY, HH:mm'),
      sortFunction: sortDate('created'),
      wrap: true,
    },
    {
      id: 2,
      name: 'Title',
      selector: (letter) => letter.title || '',
      format: (letter) => <Link to={letter.uuid}>{letter.title}</Link>,
      sortable: false,
    },
    {
      id: 3,
      name: 'Reply status',
      selector: (letter) => letter.replyStatus || '-',
      sortable: true,
    },
    {
      id: 4,
      name: 'Read receipt',
      selector: () => '', // next row here overrides this
      format: (letter) =>
        letter.replyReadTimestamp
          ? moment(letter.replyReadTimestamp).format('dddd DD/MM/YYYY, HH:mm')
          : '-',
      sortFunction: sortDate('replyReadTimestamp'),
      sortable: false,
      wrap: true,
    },
    {
      id: 5,
      name: 'Assigned to',
      omit: !showAssignmentColumn,
      selector: () => '', // next row here overrides this
      sortFunction: sortAssigneeName,
      cell: (letter) => (
        <SelectWrapper>
          <Select
            value={
              assigneeOptions
                ? assigneeOptions.find((option) => option.value === letter.assignedResponderUuid)
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
        </SelectWrapper>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={letters}
      keyField="uuid"
      defaultSortFieldId={1}
      defaultSortAsc={false}
      responsive
    />
  );
};
