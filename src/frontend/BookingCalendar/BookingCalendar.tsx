import React, { useState, useEffect, useCallback } from 'react';
import moment, { Moment } from 'moment';
import styled, { css } from 'styled-components';

import { ApiBookingType } from '../../common/constants-common';

type BookingCalendarProps = {
  bookingTypes: Array<ApiBookingType>;
};

const HOUR_CELL_HEIGHT = 3;
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

  return (
    <div className="flex width-100 align-items-flex-start">
      <div
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
      </div>

      <div className="flex flex-wrap flex-1">
        <CalendarHeader startDate={startDate} setStartDate={setStartDate} />

        <div className="flex width-100">
          {weekDays.map((currentDate) => {
            const bookingTypesInCurrentDay = bookingTypes.filter(({ rules, uuid }) => {
              const ruleOnCurrentDay = rules[currentDate.weekday()];
              return (
                ruleOnCurrentDay.enabled &&
                ruleOnCurrentDay.slots.length > 0 &&
                selectedBookingTypes.includes(uuid)
              );
            });

            const slotsInCurrentDay = bookingTypesInCurrentDay.flatMap(({ rules, uuid, name }) =>
              rules[currentDate.weekday()].slots.map(({ start, end }) => {
                const [startHour, startMinute] = start.split(':');
                const [endHour, endMinute] = end.split(':');
                return {
                  bookingTypeUuid: uuid,
                  bookingTypeName: name,
                  bookingTypeColor: getBookingTypeColor(uuid),
                  start: currentDate
                    .clone()
                    .add(parseInt(startHour), 'hours')
                    .add(parseInt(startMinute), 'minutes'),
                  end: currentDate
                    .clone()
                    .add(parseInt(endHour), 'hours')
                    .add(parseInt(endMinute), 'minutes')
                    .endOf('minute'),
                };
              }),
            );

            return (
              <CalendarColumn
                key={currentDate.format('DD-MM-YYYY')}
                currentDate={currentDate}
                dailySlots={slotsInCurrentDay}
              />
            );
          })}
        </div>
      </div>
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
      className="width-100 sticky background-white z-index-high padding-top-xxs"
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

type CalendarColumnProps = {
  dailySlots: Array<{
    bookingTypeUuid: string;
    bookingTypeName: string;
    bookingTypeColor: string;
    start: Moment;
    end: Moment;
  }>;
  currentDate: Moment;
};

const CalendarColumn: React.FC<CalendarColumnProps> = ({ currentDate, dailySlots }) => {
  const sortedDailySlots = dailySlots.sort((a, b) => a.start.diff(b.start, 'seconds'));
  return (
    <section
      className="flex flex-1 flex-column position-relative"
      aria-label={currentDate.format('ddd DD')}
    >
      {Array.from(new Array(24).keys()).map((hourOffset) => {
        return (
          <div
            aria-hidden={true}
            key={hourOffset}
            className={`
              border-bottom
              border-right
              position-relative
              ${currentDate.weekday() === 0 ? 'border-left' : ''}
            `}
            style={{
              height: `${HOUR_CELL_HEIGHT}rem`,
            }}
          >
            {currentDate.weekday() === 0 && hourOffset > 0 && (
              <div
                className={`
                  flex
                  align-items-flex-start
                  justify-content-center
                  position-absolute
                  position-top
                  position-left
                  height-100
                  padding-right-xxs
                  font-size-s
                `}
                id={`hour-marker-${hourOffset}`}
                style={{ transform: 'translateX(-100%) translateY(-0.75rem)', width: '3rem' }}
              >
                {currentDate.clone().add(hourOffset, 'hours').format('HH:mm')}
              </div>
            )}
          </div>
        );
      })}
      {sortedDailySlots
        .sort((a, b) => a.start.seconds() - b.start.seconds())
        .map(({ bookingTypeUuid, bookingTypeName, bookingTypeColor, start, end }) => {
          const top = `${(start.diff(currentDate, 'minutes') / 1440) * 100}%`;
          const height = `${(end.diff(start, 'seconds') / 3600) * HOUR_CELL_HEIGHT}rem`;
          const slotsInOverlappingZone = dailySlots.filter(
            (slot) => slot.start.diff(start, 'minutes') === 0,
          );
          const leftOffset =
            slotsInOverlappingZone.findIndex((slot) => slot.bookingTypeUuid === bookingTypeUuid) *
            2;
          return (
            <SlotButton
              key={`${bookingTypeUuid}-${start.format('HH')}`}
              top={top}
              height={height}
              leftOffset={leftOffset}
              backgroundColor={bookingTypeColor}
            >
              {bookingTypeName}
              <br />
              {`${start.format('HH:mm')} - ${end.format('HH:mm')}`}
            </SlotButton>
          );
        })}
    </section>
  );
};

const SlotButton = styled.button<{
  leftOffset: number;
  backgroundColor: string;
  top: string;
  height: string;
}>`
  font-weight: normal;
  line-height: 1.5;
  position: absolute;
  display: flex;
  color: white;
  padding: 0.25rem;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: hidden;
  whitespace: nowrap;
  text-align: left;
  ${({ backgroundColor, leftOffset, top, height }) => css`
    top: ${top};
    height: ${height};
    background-color: ${backgroundColor};
    left: calc(${leftOffset}rem + 1px);
    width: calc(100% - ${leftOffset}rem - 3px);
    &:hover,
    &:active,
    &:focus {
      color: white;
      z-index: 10;
      background-color: ${backgroundColor};
    }
  `}
`;
