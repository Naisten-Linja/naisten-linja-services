import React from 'react';
import moment, { Moment } from 'moment';
import styled, { css } from 'styled-components';

import { ApiBookedSlot } from '../../common/constants-common';
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
        .map(
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
                key={`${bookingTypeUuid}-${start.format('HH-mm')}-${end.format('HH-mm')}`}
                top={top}
                height={height}
                leftOffset={leftOffset}
                backgroundColor={bookingTypeColor}
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
                aria-label={`Book a slot for ${bookingTypeName} on ${start.format(
                  'DD MMM YYYY',
                )} from ${start.format('HH:mm')} to ${end.format('HH:mm')}`}
              >
                {bookingTypeName}
                <br />
                {`${start.format('HH:mm')} - ${end.format('HH:mm')}`}
                <br />
                Seats: {availableSeats}/{seats}
              </SlotButton>
            );
          },
        )}
    </section>
  );
};

const SlotButton = styled.button<{
  leftOffset: number;
  backgroundColor: string;
  top: string;
  height: string;
}>`
  color: white;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  line-height: 1.2;
  overflow-wrap: break-word;
  white-space: normal;
  word-wrap: break-word;
  overflow: hidden;
  padding: 0.5rem;
  position: absolute;
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
    &:focus {
      outline: 0.125rem solid #08c;
      outline-offset: 0.125rem;
    }
  `}
`;
