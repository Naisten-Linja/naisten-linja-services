import React from 'react';
import { Link } from '@reach/router';
import styled from 'styled-components';
import Select from 'react-select';
import DataTable, { TableColumn } from 'react-data-table-component';
import moment from 'moment-timezone';
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import {
  ApiLetterAdmin,
  ApiLetterWithReadStatus,
  ApiUserData,
} from '../../../common/constants-common';
import { OverrideTurretInputHeightForReactSelectDiv } from '../../shared/utils-frontend';

const SelectWrapper = styled(OverrideTurretInputHeightForReactSelectDiv)`
  width: 100%;
`;

type LetterListProps = {
  letters: Array<ApiLetterWithReadStatus>;
  users: Array<ApiUserData>;
  showAssignmentColumn: boolean;
  assignLetter: (details: { letterUuid: string; assigneeUuid: string | null }) => Promise<void>;
};

export const LetterList = ({
  letters,
  users,
  showAssignmentColumn,
  assignLetter,
}: LetterListProps) => {
  const { t } = useTranslation(namespaces.pages.letters);

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
      name: t('table.created'),
      selector: (letter) => moment(letter.created).format('dddd DD/MM/YYYY, HH:mm'),
      sortFunction: sortDate('created'),
      wrap: true,
    },
    {
      id: 2,
      name: t('table.title'),
      selector: (letter) => letter.title || '',
      format: (letter) => <Link to={letter.uuid}>{letter.title}</Link>,
      sortable: false,
    },
    {
      id: 3,
      name: t('table.reply_status'),
      selector: (letter) => letter.replyStatus || '-',
      sortable: true,
    },
    {
      id: 4,
      name: t('table.read_receipt'),
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
      name: t('table.assigned_to'),
      omit: !showAssignmentColumn,
      selector: () => '', // next row here overrides this
      sortFunction: sortAssigneeName,
      minWidth: '15rem',
      cell: (letter) => (
        <SelectWrapper>
          <Select
            value={
              assigneeOptions
                ? assigneeOptions.find((option) => option.value === letter.assignedResponderUuid)
                : null
            }
            placeholder={t('table.user_select')}
            options={assigneeOptions}
            isSearchable
            isClearable
            isOptionDisabled={(option) => option.value === letter.assignedResponderUuid}
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
