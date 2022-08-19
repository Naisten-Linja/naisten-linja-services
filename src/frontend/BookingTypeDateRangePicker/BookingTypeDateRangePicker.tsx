import React, { useEffect, useState } from 'react';
import DayPicker, { DayModifiers } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { format } from 'date-fns';
import { IoMdClose } from 'react-icons/io';

import { BookingTypeDateRange } from '../../common/constants-common';
import Modal from '../ui-components/Modal/Modal';
import { storedDateToLocalNoon } from '../ExceptionsDatePicker/ExceptionsDatePicker';
import { BookingTypeDateRangeBadge } from '../pages/BookingTypeForm';

interface ExceptionsDatePickerProps {
  value: BookingTypeDateRange | null;
  onChange: (value: BookingTypeDateRange) => void;
  onClose: () => void;
}

const BookingTypeDateRangePicker: React.FC<ExceptionsDatePickerProps> = (props) => {
  return (
    <Modal
      isOpen={props.value !== null}
      label="Select date range"
      closeModal={props.onClose}
      testId="booking-type-date-range-picker"
      style={{
        content: {
          maxWidth: '70rem',
        }
      }}
    >
      {props.value !== null
        ? <BookingTypeDateRangePickerInside
          value={props.value}
          onChange={props.onChange}
          onClose={props.onClose}
        />
        : null
      }
    </Modal>
  );
};


const BookingTypeDateRangePickerInside: React.FC<ExceptionsDatePickerProps & { value: BookingTypeDateRange }> = ({
  value: initialValue,
  onChange,
  onClose,
}) => {
  const [currValue, setCurrValue] = useState(initialValue);

  useEffect(() => {
    setCurrValue(initialValue);
  }, [initialValue]);

  const getDateInLocalNoon = (name: 'start' | 'end'): Date | undefined => {
    const value = currValue[name];
    if (value === null) return undefined;
    return storedDateToLocalNoon(value);
  }

  const dates = {
    start: getDateInLocalNoon('start'),
    end: getDateInLocalNoon('end'),
  };

  const isValid = (dates.start === undefined || dates.end === undefined) || (dates.start <= dates.end);

  useEffect(() => {
    if (isValid) onChange(currValue);
  }, [currValue, isValid])

  const handleDayClick = (name: 'start' | 'end') => (day: Date, { selected, disabled }: DayModifiers) => {
    if (disabled) {
      return;
    }
    setCurrValue(range => {
      if (selected) {
        return { ...range, [name]: null };
      } else {
        // day points to the local noon of the correct date
        return { ...range, [name]: format(day, 'yyyy-MM-dd') };
      }
    });
  };

  const handleClear = (name: 'start' | 'end') => () => {
    setCurrValue(range => {
      return { ...range, [name]: null };
    });
  };

  const today = new Date(Date.now());

  return (
    <div className="height-100 text-align-center">
      <h1 className="font-weight-semibold font-size-xl">Select range of dates when this booking type needs to be active</h1>

      <div className="margin-top-s font-weight-medium font-size-s color-dark-300">Current selection</div>
      <div className="font-size-xxl margin-top-xxs margin-bottom-m display-inline-block">
        <BookingTypeDateRangeBadge range={currValue} />
      </div>

      <div className="flex flex-row flex-wrap">
        {([
          {
            key: 'start',
            title: 'Start date',
            disabled: dates['end'] ? { after: dates['end'] } : undefined
          },
          {
            key: 'end',
            title: 'End date',
            disabled: dates['start'] ? { before: dates['start'] } : undefined
          },
        ] as const).map(({ key, title, disabled }) => (
          <div style={{ flex: 1 }} className="padding-xs margin-xs border border-color-light">
            <h2>{title}</h2>
            <div className="font-size-s font-weight-bold margin-top-s margin-bottom-m">{currValue[key] ? currValue[key] : 'Not specified'}</div>
            <div>
              <DayPicker
                month={dates[key] || today}
                selectedDays={dates[key]}
                onDayClick={handleDayClick(key)}
                disabledDays={disabled}
              />
            </div>
            <button
              className="button button-s button-error button-icon"
              disabled={currValue[key] === null}
              style={{ opacity: currValue[key] === null ? 0.1 : 1 }}
              onClick={handleClear(key)}
            >
              <IoMdClose aria-hidden={true}></IoMdClose>
              <span>Clear selection</span>
            </button>
          </div>
        ))}
      </div>

      <button
        className="position-fixed position-bottom-right margin-m button-primary"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
};

export default BookingTypeDateRangePicker;
