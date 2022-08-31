import React, { useEffect, useState, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';
import moment from 'moment-timezone';

import {
  ApiLetterAdmin,
  ApiLetterWithReadStatus,
  ApiUserData,
  BookingTypeDateRange,
  UserRole,
} from '../../../common/constants-common';
import { useNotifications } from '../../NotificationsContext';
import { useAuth } from '../../AuthContext';
import { useRequest } from '../../shared/http';
import { LetterList } from './LetterList';
import { LetterCounts } from './LetterCounts';
import { BookingTypeBadgeDateRange } from '../BookingTypes/BookingTypeBadgeDateRange';
import BookingTypeDateRangePicker from '../BookingTypes/BookingTypeDateRangePicker/BookingTypeDateRangePicker';
import { isDateInActiveDateRanges } from '../Booking/BookingCalendar/BookingCalendar';

export const Letters: React.FunctionComponent<RouteComponentProps> = () => {
  const [letters, setLetters] = useState<Array<ApiLetterWithReadStatus>>([]);
  const [users, setUsers] = useState<Array<ApiUserData>>([]);

  const [selectedDateRange, setSelectedDateRange] = useState<BookingTypeDateRange>({
    start: null,
    end: null,
  });
  const [dateRangeSelectorVisible, setDateRangeSelectorVisible] = useState(false);

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

  const filteredLetters = letters.filter((letter) =>
    isDateInActiveDateRanges(moment(letter.created), [selectedDateRange]),
  );

  return (
    <>
      <div className="flex justify-content-space-between flex-wrap">
        <h1>Letters</h1>
        <div className="box-shadow-l padding-s display-inline-block">
          <label htmlFor="user-list-booking-type-select">Show letters created on:</label>
          <BookingTypeBadgeDateRange
            range={selectedDateRange}
            onEdit={() => {
              setDateRangeSelectorVisible(true);
            }}
            className="display-inline-block"
          />
        </div>
      </div>
      <LetterCounts letters={filteredLetters} />
      <LetterList
        letters={filteredLetters}
        users={users}
        showAssignmentColumn={isStaff}
        assignLetter={assignLetter}
      />
      <BookingTypeDateRangePicker
        currentRange={dateRangeSelectorVisible ? selectedDateRange : null}
        onChange={(value) => setSelectedDateRange(value)}
        onClose={() => setDateRangeSelectorVisible(false)}
        title={'Select date range which contains the letters you want to see'}
      />
    </>
  );
};
