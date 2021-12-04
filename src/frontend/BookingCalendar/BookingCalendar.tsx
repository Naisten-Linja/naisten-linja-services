import React, { useState } from 'react';

import moment, { Moment } from 'moment';

import { ApiBookingType } from '../../common/constants-common';

type BookingCalendarProps = {
  bookingTypes: Array<ApiBookingType>;
};

const currentDate = moment(new Date());

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookingTypes }) => {
  const [startDate, setStartDate] = useState(currentDate.startOf('week'));
  const [selectedBookingTypes, setSelectedBookingTypes] = useState(
    bookingTypes.map(({ uuid }) => uuid),
  );

  const weekDays = Array.from(new Array(7).keys()).map((dayOffset) =>
    startDate.clone().add(dayOffset, 'days'),
  );

  return (
    <div className="flex width-100 align-items-flex-start">
      <div
        className="flex flex-wrap sticky padding-right-s"
        style={{ width: '15rem', top: '4rem' }}
      >
        <h1 className="font-size-xxl">Book a slot</h1>
        {bookingTypes.map(({ uuid, name }) => (
          <div key={uuid} className="flex width-100 align-items-center margin-top-xxs">
            <input
              className="no-margin-bottom"
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
            <label className="no-margin-vertical" htmlFor={`filter-type-${uuid}`}>
              {name}
            </label>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap flex-1">
        <CalendarControl startDate={startDate} setStartDate={setStartDate} />

        <div
          className="flex width-100 sticky margin-top-s background-white border-bottom z-index-high"
          style={{ top: '3rem' }}
          aria-hidden={true}
        >
          {weekDays.map((currentDate) => (
            <div
              key={currentDate.format('DD-MM-YYYY')}
              className="flex-1 text-align-center padding-vertical-s position-relative"
            >
              {currentDate.weekday() === 0 && (
                <div
                  className="position-absolute height-100 position-top position-left background-white border-bottom border-right"
                  style={{ width: '3rem', transform: 'translateX(-100%)' }}
                ></div>
              )}
              <span className="font-size-s">{currentDate.format('ddd')}</span> <br />
              <span className="font-size-xxl">{currentDate.format('DD')}</span>
            </div>
          ))}
        </div>

        <div className="flex width-100">
          {weekDays.map((currentDate) => (
            <CalendarColumn
              key={currentDate.format('DD-MM-YYYY')}
              currentDate={currentDate}
              bookingTypes={bookingTypes}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CalendarControl: React.FC<{ startDate: Moment; setStartDate(d: Moment): void }> = ({
  startDate,
  setStartDate,
}) => {
  const endDate = startDate.clone().endOf('week');
  return (
    <section className="flex width-100 align-items-center">
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
            padding-vertical-xxs
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
  );
};

const CalendarColumn: React.FC<{ bookingTypes: Array<ApiBookingType>; currentDate: Moment }> = ({
  currentDate,
}) => {
  return (
    <section
      className="flex flex-1 flex-column position-relative"
      aria-label={currentDate.format('ddd DD')}
    >
      {Array.from(new Array(24).keys()).map((hourOffset) => {
        return (
          <div
            key={hourOffset}
            className="padding-horizontal-s padding-vertical-m border-bottom border-right position-relative"
            aria-hidden={true}
          >
            {currentDate.weekday() === 0 && (
              <div
                className="flex align-items-center justify-content-center border-right position-absolute position-top position-left height-100 padding-right-xxs font-size-s"
                style={{ transform: 'translateX(-100%)', width: '3rem' }}
              >
                {currentDate.clone().add(hourOffset, 'hours').format('HH:mm')}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};
