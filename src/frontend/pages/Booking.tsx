import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Calendar, CheckBox } from 'grommet';
import styled from 'styled-components';

import { ApiBookingType, WeekDays } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';

type SelectedSlot = {
  dateTimestamp: number;
  start: string;
  end: string;
};

export const Booking: React.FunctionComponent<RouteComponentProps> = () => {
  const [selectedSlots, setSelectedSlots] = useState<Array<SelectedSlot>>([]);
  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingType>>([]);
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingType> }>(
        '/api/booking-types',
        { useJwt: true },
      );
      setBookingTypes(bookingTypesResult.data.data);
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to get all booking types' });
    }
  }, [addNotification, setBookingTypes, getRequest]);

  useEffect(() => {
    fetchBookingTypes();
  }, [fetchBookingTypes]);

  const today = new Date();
  const upperBoundDate = new Date(new Date().setMonth(today.getMonth() + 2));

  const bookingType = bookingTypes[1];
  return (
    <>
      <h1>Booking</h1>
      <CalendarContainer>
        <Calendar
          firstDayOfWeek={0}
          daysOfWeek={true}
          fill={true}
          animate={false}
          bounds={[today.toISOString().slice(0, 10), upperBoundDate.toISOString().slice(0, 10)]}
          children={({ date }) => (
            <CalendarDateCell
              date={date}
              bookingType={bookingType}
              selectedSlots={selectedSlots}
              setSelectedSlots={setSelectedSlots}
            />
          )}
        />
      </CalendarContainer>
      {JSON.stringify(selectedSlots)}
    </>
  );
};

interface CalendarDateCellProps {
  date: Date;
  bookingType: ApiBookingType;
  selectedSlots: Array<SelectedSlot>;
  setSelectedSlots: (items: Array<SelectedSlot>) => void;
}

const CalendarDateCell: React.FunctionComponent<CalendarDateCellProps> = ({
  date,
  bookingType,
  selectedSlots,
  setSelectedSlots,
}) => {
  if (!bookingType) {
    return null;
  }

  const isBookable = isBookableDay(date, bookingType);
  const weekDay = weekDays[date.getDay()];
  const dayRule = bookingType.rules[weekDay];
  return (
    <DayCell isDisabled={!isBookable}>
      <div>{date.getDate()}</div>
      {!dayRule.disabled &&
        dayRule.slots.map((slot, idx) => {
          const slotItem = {
            dateTimestamp: date.getTime(),
            start: slot.start,
            end: slot.end,
          };
          const isSelected =
            selectedSlots.find(
              (s) =>
                s.dateTimestamp === slotItem.dateTimestamp &&
                s.start === slotItem.start &&
                s.end === slotItem.end,
            ) !== undefined;
          const checkboxHandler = () => {
            if (!isSelected) {
              setSelectedSlots([...selectedSlots, slotItem]);
            } else {
              setSelectedSlots(
                selectedSlots.filter(
                  (s) =>
                    s.dateTimestamp !== slotItem.dateTimestamp ||
                    s.start !== slotItem.start ||
                    s.end !== slotItem.end,
                ),
              );
            }
          };
          return (
            <CheckBox
              checked={isSelected}
              label={`${slot.start} - ${slot.end}`}
              key={idx}
              onChange={checkboxHandler}
            />
          );
        })}
    </DayCell>
  );
};

const CalendarContainer = styled.div`
  width: 100%;
  * {
    box-sizing: border-box;
  }
`;

const DayCell = styled.div<{ isDisabled?: boolean }>`
  width: 100%;
  height: 100%;
  background: #fff;
  padding: 0.5rem;
  border: 1px solid #ebebeb;
  border-radius: 8px;
  color: ${({ isDisabled = true }) => (!isDisabled ? '#2e3138' : '#999999')};
  box-sizing: border-box;
`;

export function isBookableDay(date: Date, bookingType: ApiBookingType): boolean {
  const weekDay = weekDays[date.getDay()];
  return weekDay === undefined
    ? false
    : !bookingType.rules[weekDay]
    ? false
    : !bookingType.rules[weekDay].disabled;
}

export const weekDays: Array<WeekDays> = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];
