import React from 'react';
import DayPicker, { DayModifiers } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { format } from 'date-fns';
import { IoMdClose } from 'react-icons/io';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../../i18n/i18n.constants';

import { BookingTypeDateRange } from '../../../../common/constants-common';
import Modal from '../../../ui-components/Modal/Modal';
import { storedDateToLocalNoon } from '../ExceptionsDatePicker/ExceptionsDatePicker';
import { BookingTypeBadgeDateRange } from '../BookingTypeBadgeDateRange';

interface BookingTypeDateRangePickerProps {
  currentRange: BookingTypeDateRange | null;
  onChange: (value: BookingTypeDateRange) => void;
  onClose: () => void;
  title: string;
}

/**
 * Modal for picking optional start and end date.
 *
 * See the actual logic in a subcomponent below.
 */
const BookingTypeDateRangePicker: React.FC<BookingTypeDateRangePickerProps> = (props) => {
  return (
    <Modal
      isOpen={props.currentRange !== null}
      label="Select date range"
      closeModal={props.onClose}
      testId="booking-type-date-range-picker"
      style={{
        content: {
          maxWidth: '70rem',
        },
      }}
    >
      {props.currentRange !== null ? (
        <BookingTypeDateRangePickerInside
          currentRange={props.currentRange}
          onChange={props.onChange}
          onClose={props.onClose}
          title={props.title}
        />
      ) : null}
    </Modal>
  );
};

const BookingTypeDateRangePickerInside: React.FC<
  BookingTypeDateRangePickerProps & { currentRange: BookingTypeDateRange }
> = ({ currentRange, onChange, onClose, title }) => {
  const { t } = useTranslation(namespaces.pages.bookingTypes);

  const setRangeValue = (key: 'start' | 'end', newValue: string | null) => {
    onChange({ ...currentRange, [key]: newValue });
  };

  const getDateInLocalNoon = (name: 'start' | 'end'): Date | undefined => {
    const v = currentRange[name];
    if (v === null) return undefined;
    return storedDateToLocalNoon(v);
  };

  const dates = {
    start: getDateInLocalNoon('start'),
    end: getDateInLocalNoon('end'),
  };

  const handleDayClick =
    (name: 'start' | 'end') =>
    (day: Date, { selected, disabled }: DayModifiers) => {
      if (disabled) {
        return;
      }
      if (selected) {
        setRangeValue(name, null);
      } else {
        // day points to the local noon of the correct date
        setRangeValue(name, format(day, 'yyyy-MM-dd'));
      }
    };

  const handleClear = (name: 'start' | 'end') => () => {
    setRangeValue(name, null);
  };

  const today = new Date(Date.now());

  return (
    <div className="height-100 text-align-center">
      <h1 className="font-weight-semibold font-size-xl">{title}</h1>

      <div className="margin-top-s font-weight-medium font-size-s color-dark-300">
        {t('date_range_picker.inside.current_selection')}
      </div>
      <div className="font-size-xxl margin-top-xxs margin-bottom-m display-inline-block">
        <BookingTypeBadgeDateRange range={currentRange} />
      </div>

      <div className="flex flex-row flex-wrap">
        {(
          [
            {
              key: 'start',
              title: t('date_range_picker.inside.start_date'),
              disabled: dates['end'] ? { after: dates['end'] } : undefined,
            },
            {
              key: 'end',
              title: t('date_range_picker.inside.end_date'),
              disabled: dates['start'] ? { before: dates['start'] } : undefined,
            },
          ] as const
        ).map(({ key, title, disabled }) => (
          <div
            style={{ flex: 1 }}
            className="padding-xs margin-xs border border-color-light"
            key={key}
          >
            <h2>{title}</h2>
            <div className="font-size-s font-weight-bold margin-top-s margin-bottom-m">
              {currentRange[key] ? currentRange[key] : t('date_range_picker.inside.not_specified')}
            </div>
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
              disabled={currentRange[key] === null}
              style={{ opacity: currentRange[key] === null ? 0.1 : 1 }}
              onClick={handleClear(key)}
            >
              <IoMdClose aria-hidden={true}></IoMdClose>
              <span>{t('date_range_picker.inside.clear_selection')}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="text-align-right">
        <button className="margin-m button-primary" onClick={onClose}>
          {t('date_range_picker.inside.close')}
        </button>
      </div>
    </div>
  );
};

export default BookingTypeDateRangePicker;
