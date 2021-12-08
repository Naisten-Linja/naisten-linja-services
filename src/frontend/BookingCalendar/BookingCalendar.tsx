import React, { useState, useEffect, useCallback } from 'react';
import moment, { Moment } from 'moment';
import styled from 'styled-components';
import {
  DialogContent as ReachDialogContent,
  DialogOverlay as ReachDialogOverlay,
} from '@reach/dialog';
import '@reach/dialog/styles.css';

import { ApiBookingType, ApiBookedSlot } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';
import { CalendarColumn } from './CalendarColumn';
import { BookingForm } from './BookingForm';
import { HOUR_CELL_HEIGHT, BookingSlotDetails } from './shared-constants';

const DialogOverlay = styled(ReachDialogOverlay)`
  z-index: 99;
`;

const DialogContent = styled(ReachDialogContent)`
  width: 25rem;
  max-width: 100%;
  margin: 0;
  height: 100vh;
`;

type BookingCalendarProps = {
  bookingTypes: Array<ApiBookingType>;
};

const currentDate = moment(new Date());

const bookingTypeColors = [
  'rgba(13, 60, 85, 0.9)',
  'rgba(192, 46, 29, 0.9)',
  'rgba(13, 84, 73, 0.9)',
  'rgba(34, 34, 51, 0.9)',
  'rgba(84, 38, 13, 0.9)',
  'rgba(81, 84, 10, 0.9)',
];

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookingTypes }) => {
  const [startDate, setStartDate] = useState(currentDate.startOf('week'));
  const [selectedBookingTypes, setSelectedBookingTypes] = useState<Array<string>>([]);
  const [bookingDetails, setBookingDetails] = useState<BookingSlotDetails | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Array<ApiBookedSlot>>([]);
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookedSlots = useCallback(
    async (callback: (data: Array<ApiBookedSlot>) => void) => {
      try {
        const endDate = startDate.clone().endOf('week');
        const result = await getRequest<{ data: Array<ApiBookedSlot> }>(
          `/api/bookings/calendar?startDate=${encodeURIComponent(
            startDate.toString(),
          )}&endDate=${encodeURIComponent(endDate.toString())}`,
          { useJwt: true },
        );
        callback(result.data.data);
      } catch (err) {
        addNotification({ type: 'error', message: 'Unable to fetch booked slots' });
      }
    },
    [startDate, getRequest, addNotification],
  );

  useEffect(() => {
    let updateStateAfterFetch = true;
    const delayedFetch = setTimeout(() => {
      fetchBookedSlots((bookedSlots) => {
        if (updateStateAfterFetch) {
          setBookedSlots(bookedSlots);
        }
      });
    }, 300);
    return () => {
      clearTimeout(delayedFetch);
      updateStateAfterFetch = false;
    };
  }, [setBookedSlots, fetchBookedSlots]);

  useEffect(() => {
    setSelectedBookingTypes(bookingTypes.map(({ uuid }) => uuid));
  }, [bookingTypes, setSelectedBookingTypes]);

  useEffect(() => {
    const earliestStartHour = Math.min(
      ...bookingTypes.flatMap(({ rules }) =>
        rules.flatMap(({ slots }) => slots.map(({ start }) => parseInt(start.split(':')[0]))),
      ),
    );
    window.scrollTo({ top: earliestStartHour * HOUR_CELL_HEIGHT * 16 });
  }, [bookingTypes]);

  const weekDays = Array.from(new Array(7).keys()).map((dayOffset) =>
    startDate.clone().add(dayOffset, 'days'),
  );

  const getBookingTypeColor = useCallback(
    (id) => {
      return bookingTypeColors[
        bookingTypes.findIndex(({ uuid }) => uuid === id) % bookingTypeColors.length
      ];
    },
    [bookingTypes],
  );

  const openBookingForm = (details: BookingSlotDetails) => {
    setBookingDetails(details);
  };

  return (
    <div className="flex width-100 align-items-flex-start">
      <section
        className="flex flex-wrap sticky padding-right-s"
        style={{ width: '12rem', top: '4rem', marginRight: '3rem' }}
      >
        <h1 className="font-size-xxl">Book a slot</h1>

        {bookingTypes.map(({ uuid, name }) => (
          <div
            key={uuid}
            className="flex width-100 align-items-flex-start margin-top-xs position-relative"
          >
            <div
              aria-hidden={true}
              style={{
                width: '0.75rem',
                height: '0.75rem',
                position: 'absolute',
                top: '0.25rem',
                left: '-1.25rem',
                borderRadius: '50%',
                overflow: 'hidden',
                background: getBookingTypeColor(uuid),
              }}
            />
            <input
              className="no-margin-top no-margin-bottom"
              style={{ transform: 'translateY(2px)' }}
              id={`filter-type-${uuid}`}
              type="checkbox"
              checked={selectedBookingTypes.includes(uuid)}
              onChange={() => {
                if (selectedBookingTypes.includes(uuid)) {
                  setSelectedBookingTypes(selectedBookingTypes.filter((id) => id !== uuid));
                } else {
                  setSelectedBookingTypes([...selectedBookingTypes, uuid]);
                }
              }}
            />
            <label className="no-margin-vertical line-height-1" htmlFor={`filter-type-${uuid}`}>
              {name}
            </label>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap flex-1">
        <CalendarHeader startDate={startDate} setStartDate={setStartDate} />

        <section className="flex width-100">
          {weekDays.map((currentDate) => {
            const bookingTypesInCurrentDay = bookingTypes.filter(({ rules, uuid, exceptions }) => {
              const ruleOnCurrentDay = rules[currentDate.weekday()];
              return (
                !exceptions.find((exceptionDate) => moment(exceptionDate).isSame(currentDate)) &&
                ruleOnCurrentDay.enabled &&
                ruleOnCurrentDay.slots.length > 0 &&
                selectedBookingTypes.includes(uuid)
              );
            });

            const slotsInCurrentDay = bookingTypesInCurrentDay.flatMap(({ rules, uuid, name }) =>
              rules[currentDate.weekday()].slots.map(({ start, end, seats }) => {
                const [startHour, startMinute] = start.split(':');
                const [endHour, endMinute] = end.split(':');
                return {
                  seats,
                  bookingTypeUuid: uuid,
                  bookingTypeName: name,
                  bookingTypeColor: getBookingTypeColor(uuid),
                  start: currentDate
                    .clone()
                    .add(parseInt(startHour), 'hours')
                    .add(parseInt(startMinute), 'minutes')
                    .startOf('minute'),
                  end: currentDate
                    .clone()
                    .add(parseInt(endHour), 'hours')
                    .add(parseInt(endMinute), 'minutes')
                    .startOf('minute'),
                };
              }),
            );

            return (
              <CalendarColumn
                key={currentDate.format('DD-MM-YYYY')}
                currentDate={currentDate}
                dailySlots={slotsInCurrentDay}
                openBookingForm={openBookingForm}
                bookedSlots={bookedSlots}
              />
            );
          })}
        </section>
      </div>
      {bookingDetails && (
        <DialogOverlay onDismiss={() => setBookingDetails(null)}>
          <DialogContent aria-label="Make a new booking">
            <BookingForm
              dismissModal={() => {
                setBookingDetails(null);
              }}
              afterSubmit={() => {
                fetchBookedSlots((bookedSlots) => {
                  setBookedSlots(bookedSlots);
                });
              }}
              {...bookingDetails}
            />
          </DialogContent>
        </DialogOverlay>
      )}
    </div>
  );
};

const CalendarHeader: React.FC<{ startDate: Moment; setStartDate(d: Moment): void }> = ({
  startDate,
  setStartDate,
}) => {
  const endDate = startDate.clone().endOf('week');
  const weekDays = Array.from(new Array(7).keys()).map((dayOffset) =>
    startDate.clone().add(dayOffset, 'days'),
  );

  return (
    <div
      className="width-100 sticky background-white padding-top-xxs z-index-medium"
      style={{ top: '2.85rem' }}
    >
      <section className="flex width-100 align-items-center margin-bottom-xxs">
        <div className="button-group">
          <button
            className="button"
            onClick={() => {
              setStartDate(startDate.clone().subtract(7, 'days'));
            }}
            aria-label="Previous week"
          >{`<`}</button>
          <button
            className="button"
            onClick={() => setStartDate(startDate.clone().add(7, 'days'))}
            aria-label="Next week"
          >{`>`}</button>
        </div>
        <h2 className="no-margin">
          <span
            className={`
              background-light-200
              border-radius
              font-size-m
              font-weight-regular
              margin-xs
              padding-horizontal-xs
          `}
          >
            {`Week ${startDate.format('w')}`}
          </span>
          {startDate.year() !== endDate.year()
            ? `${startDate.format('MMMM YYYY')} - ${endDate.format('MMMM YYYY')}`
            : startDate.month() !== endDate.month()
            ? ` ${startDate.format('MMMM ')} - ${endDate.format('MMMM YYYY')}`
            : startDate.format('MMMM YYYY')}
        </h2>
      </section>
      <div className="flex width-100 border-bottom position-top" aria-hidden={true}>
        {weekDays.map((currentDate) => (
          <div
            key={currentDate.format('DD-MM-YYYY')}
            className={`
                flex-1
                text-align-center
                padding-vertical-xxs
                position-relative
                ${
                  currentDate.clone().startOf('day').diff(moment().startOf('day'), 'days') === 0
                    ? 'background-light-50'
                    : 'background-white'
                }
              `}
          >
            <span className="font-size-s">{currentDate.format('ddd')}</span> <br />
            <span className="font-size-xxl">{currentDate.format('DD')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
