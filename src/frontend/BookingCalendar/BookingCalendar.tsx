import React, { useState, useEffect, useCallback, useRef } from 'react';
import moment, { Moment } from 'moment-timezone';
import styled from 'styled-components';
import {
  DialogContent as ReachDialogContent,
  DialogOverlay as ReachDialogOverlay,
} from '@reach/dialog';
import '@reach/dialog/styles.css';

import { ApiBookedSlot, ApiBooking, ApiBookingTypeWithColor } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';
import { CalendarColumn } from './CalendarColumn';
import { BookingForm } from './BookingForm';
import { HOUR_CELL_HEIGHT, BookingSlotDetails } from './shared-constants';

const DialogOverlay = styled(ReachDialogOverlay)`
  z-index: 110;
`;

const DialogContent = styled(ReachDialogContent)`
  width: 25rem;
  max-width: 100%;
  margin: 0;
  min-height: 100vh;
`;

type BookingCalendarProps = {
  bookingTypes: Array<ApiBookingTypeWithColor>;
};

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookingTypes }) => {
  // Give current date in Finnish (since default timezone was already set in App.tsx)
  // This has to be inside this component because on the main level the default time zone
  // is not set yet.
  const currentDate = useRef(moment()).current;

  const [startDate, setStartDate] = useState(currentDate.startOf('week'));
  const [selectedBookingTypes, setSelectedBookingTypes] = useState<Array<string>>([]);
  const [bookingDetails, setBookingDetails] = useState<BookingSlotDetails | null>(null);
  const [bookedSlots, setBookedSlots] = useState<Array<ApiBookedSlot>>([]);
  const [ownBookings, setOwnBookings] = useState<Array<ApiBooking>>([]);
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

  const fetchOwnBookings = useCallback(
    async (callback: (data: Array<ApiBooking>) => void) => {
      const result = await getRequest<{ data: Array<ApiBooking> }>('/api/bookings', {
        useJwt: true,
      });
      if (result.data.data) {
        callback(result.data.data.sort((a, b) => (new Date(a.start) > new Date(b.start) ? 1 : -1)));
      }
    },
    [getRequest],
  );

  useEffect(() => {
    let updateStateAfterFetch = true;
    const delayedFetch = setTimeout(() => {
      fetchBookedSlots((bookedSlots) => {
        if (updateStateAfterFetch) {
          setBookedSlots(bookedSlots);
        }
      });
      fetchOwnBookings((bookings) => {
        if (updateStateAfterFetch) {
          setOwnBookings(bookings);
        }
      });
    }, 300);
    return () => {
      clearTimeout(delayedFetch);
      updateStateAfterFetch = false;
    };
  }, [setBookedSlots, fetchBookedSlots, fetchOwnBookings, setOwnBookings]);

  useEffect(() => {
    setSelectedBookingTypes(bookingTypes.map(({ uuid }) => uuid));
  }, [bookingTypes, setSelectedBookingTypes]);

  const bookingWrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const earliestStartHour = Math.min(
      ...bookingTypes.flatMap(({ rules }) =>
        rules.flatMap(({ slots }) => slots.map(({ start }) => parseInt(start.split(':')[0]))),
      ),
    );

    bookingWrapper.current?.scroll({ top: earliestStartHour * HOUR_CELL_HEIGHT * 14 });
  }, [bookingTypes]);

  const weekDays = Array.from(new Array(7).keys()).map((dayOffset) =>
    startDate.clone().add(dayOffset, 'days'),
  );

  const openBookingForm = (details: BookingSlotDetails) => {
    setBookingDetails(details);
  };

  return (
    <div
      ref={bookingWrapper}
      className="flex flex-wrap align-items-flex-start overflow-auto"
      style={{ height: 'calc(100vh - 5vh - 2rem - 6rem)', marginBottom: '-5rem' }}
    > {/*
        -5vh: space for multiline header
        -2rem: container top padding
        -6rem: estimated normal header bar
        -5rem margin-bottom: remove the parent container bottom margin
      */}
      <section
        className="flex flex-wrap sticky padding-right-s"
        style={{ width: '12rem', top: 0, marginRight: '3rem' }}
      >
        <h1 className="font-size-xxl">Book a slot</h1>
        {bookingTypes.map(({ uuid, name, color }) => (
          <div key={uuid} className="flex align-items-center margin-vertical-1-4">
            <div
              aria-hidden={true}
              style={{
                width: '0.75rem',
                height: '0.75rem',
                borderRadius: '50%',
                marginRight: 8,
                flexShrink: 0,
                background: color,
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

      <div className="flex-1" style={{ marginLeft: "3rem" }}>
        <CalendarHeader startDate={startDate} setStartDate={setStartDate} />

        <section className="flex" >
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

            const slotsInCurrentDay = bookingTypesInCurrentDay.flatMap(
              ({ rules, uuid, name, additionalInformation, color }) =>
                rules[currentDate.weekday()].slots.map(({ start, end, seats }) => {
                  const [startHour, startMinute] = start.split(':');
                  const [endHour, endMinute] = end.split(':');
                  return {
                    seats,
                    bookingTypeUuid: uuid,
                    bookingTypeName: name,
                    bookingTypeColor: color,
                    bookingTypeAdditionalInformation: additionalInformation || '',
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
              ownBookings={ownBookings}
              afterSubmit={() => {
                fetchBookedSlots((bookedSlots) => {
                  setBookedSlots(bookedSlots);
                });
                fetchOwnBookings((bookings) => {
                  setOwnBookings(bookings);
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
    <div className="width-100 sticky background-white z-index-medium" style={{ top: 0 }}>
      <div className="position-relative width-100 padding-top-xxs ">
        {/* Workaround to hide the hour marker when scrolling down the page */}
        <div
          className="position-absolute position-top-left height-100 background-white"
          style={{ width: '3rem', transform: 'translateX(-100%)' }}
        />
        <section className="flex flex-wrap width-100 align-items-center margin-bottom-xxs">
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
              style={{ whiteSpace: 'nowrap' }}
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
        <p>
          <b>Please note booking times are in Europe/Helsinki timezone</b>
        </p>
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
    </div>
  );
};
