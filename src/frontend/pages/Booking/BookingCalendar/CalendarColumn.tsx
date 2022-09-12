import React from 'react';
import moment, { Moment } from 'moment-timezone';
import styled, { css } from 'styled-components';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../../i18n/i18n.constants';

import { ApiBookedSlot } from '../../../../common/constants-common';
const HOUR_CELL_HEIGHT = 3;
import { BookingSlotDetails } from './shared-constants';

type CalendarColumnProps = {
  dailySlots: Array<{
    bookingTypeUuid: string;
    bookingTypeName: string;
    bookingTypeAdditionalInformation: string;
    bookingTypeColor: string;
    start: Moment;
    end: Moment;
    seats: number;
  }>;
  currentDate: Moment;
  openBookingForm: (details: BookingSlotDetails) => void;
  bookedSlots: Array<ApiBookedSlot>;
};

export const CalendarColumn: React.FC<CalendarColumnProps> = ({
  currentDate,
  dailySlots,
  openBookingForm,
  bookedSlots,
}) => {
  const { t } = useTranslation(namespaces.pages.bookingCalendar);

  const sortedDailySlots = dailySlots.sort(
    (a, b) =>
      a.start.diff(b.start, 'minutes') ||
      a.end.diff(a.start, 'minutes') - b.end.diff(b.start, 'minutes'),
  );
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
      {sortedDailySlots.map(
        ({
          bookingTypeUuid,
          bookingTypeName,
          bookingTypeColor,
          bookingTypeAdditionalInformation,
          start,
          end,
          seats,
        }) => {
          const bookedSlotCount =
            bookedSlots.find(
              (slot) =>
                slot.bookingTypeUuid === bookingTypeUuid &&
                moment(slot.start).isSame(start) &&
                moment(slot.end).isSame(end),
            )?.count || 0;
          const availableSeats = seats - bookedSlotCount;

          // Assign background color for a booking slot. If it's an old booking, grey out
          const bgColor = end.isBefore(moment()) ? '#8c8c8c' : bookingTypeColor;
          // Add diagonal pattern to the background if the seats are fully booked
          const slotBackground =
            availableSeats > 0
              ? bgColor
              : `repeating-linear-gradient(
            45deg,
            ${bgColor} 0px,
            #000 0px,
            #000 5px,
            ${bgColor} 5px,
            ${bgColor} 10px
          );`;

          const top = `${(start.diff(currentDate, 'minutes') / 1440) * 100}%`;
          const height = `${(end.diff(start, 'seconds') / 3600) * HOUR_CELL_HEIGHT}rem`;
          // Get overlapping slots
          // The result also includes the current slot, so there there only actual overlapping if slotsInOverlappingZone.length === 2
          const slotsInOverlappingZone = sortedDailySlots.filter(
            (slot) =>
              (slot.start.isSame(start) && slot.end.isSame(end)) ||
              start.isBetween(slot.start, slot.end) ||
              slot.start.isBetween(start, end),
          );
          const leftOffset =
            slotsInOverlappingZone.findIndex((slot) => slot.bookingTypeUuid === bookingTypeUuid) > 0
              ? '50%'
              : '0';
          return (
            <SlotButton
              key={`${bookingTypeUuid}-${start.format('HH-mm')}-${end.format('HH-mm')}`}
              top={top}
              height={height}
              leftOffset={leftOffset}
              background={slotBackground}
              width={slotsInOverlappingZone.length > 1 ? '50%' : '100%'}
              onClick={() =>
                openBookingForm({
                  bookingTypeName,
                  bookingTypeUuid,
                  bookingTypeAdditionalInformation,
                  start,
                  end,
                  seats,
                  availableSeats,
                })
              }
              aria-label={t('calendar_column.aria_booking_slot', {
                bookingTypeName: bookingTypeName,
                startDate: start.format('DD MMM YYYY'),
                startTime: start.format('HH:mm'),
                endTime: end.format('HH:mm'),
              })}
            >
              {bookingTypeName}
              <br />
              {`${start.format('HH:mm')} - ${end.format('HH:mm')}`}
              <br />
              {t('calendar_column.seats')}: {availableSeats}/{seats}
            </SlotButton>
          );
        },
      )}
    </section>
  );
};

const SlotButton = styled.button<{
  leftOffset: string;
  background: string;
  top: string;
  height: string;
  width: string;
}>`
  color: white;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  line-height: 1.2;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
  overflow: hidden;
  padding: 0.5rem;
  position: absolute;
  text-align: left;
  font-size: 0.8rem;
  &:focus {
    z-index: inherit !important;
    &:hover {
      z-index: 2 !important;
    };
  };
  ${({ background, leftOffset, top, height, width }) => css`
    top: ${top};
    height: ${height};
    background: ${background};
    left: ${leftOffset};
    width: ${width};
    &:hover,
    &:active,
    &:focus {
      color: white;
      z-index: 2;
      background: ${background};
    }
    &:focus {
      outline: 0.125rem solid #08c;
      outline-offset: 0.125rem;
    }
  `}
`;
