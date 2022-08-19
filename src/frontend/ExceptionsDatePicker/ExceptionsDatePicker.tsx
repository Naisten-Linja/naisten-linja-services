import React from 'react';
import DayPicker, { DateUtils, DayModifiers } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { useField } from 'formik';
import { SlotBookingRules } from '../../common/constants-common';
import Modal from '../ui-components/Modal/Modal';
import { format } from 'date-fns';

interface ExceptionsDatePickerProps {
  showDatePicker: boolean;
  closeModal: (b: boolean) => void;
}

const ExceptionsDatePicker: React.FC<ExceptionsDatePickerProps> = ({
  showDatePicker,
  closeModal,
}) => {
  const [{ value: exceptions }, , { setValue }] = useField<Array<string>>('exceptions');
  const [{ value: rules }] = useField('rules');

  // exceptions is list of "2022-12-30" formatted strings
  // dateExceptions is list of Date objects which point to the NOON IN BROWSER'S LOCAL TIMEZONE
  const dateExceptions = exceptions.map(storedDateToLocalNoon);

  const handleDayClick = (day: Date, { selected, disabled }: DayModifiers) => {
    // day points to the local noon of the correct date
    if (disabled) {
      return;
    }

    const newExceptions = [...exceptions];

    if (selected) {
      const selectedIndex = exceptions.findIndex((selectedItem) =>
        DateUtils.isSameDay(storedDateToLocalNoon(selectedItem), day),
      );
      newExceptions.splice(selectedIndex, 1);
    } else {
      newExceptions.push(format(day, 'yyyy-MM-dd'));
    }

    setValue(newExceptions);
  };

  const getDisabledDays = () => {
    const disabledDays = [] as Array<number>;
    rules.forEach((rule: SlotBookingRules, index: number) => {
      if (rule.slots.length === 0) {
        disabledDays.push(index);
      }
    });

    return disabledDays;
  };

  const today = new Date(Date.now());

  return (
    <Modal
      isOpen={showDatePicker}
      label="Choose exeptions"
      closeModal={closeModal}
      testId="exceptions-date-picker"
    >
      <div className="height-100 text-align-center">
        <h1 className="font-weight-semibold">Choose exceptions</h1>

        <div className="flex-column">
          <div>
            <DayPicker
              month={today}
              selectedDays={dateExceptions}
              onDayClick={handleDayClick}
              disabledDays={[{ before: today }, { daysOfWeek: getDisabledDays() }]}
            />
          </div>

          <button
            className="position-fixed position-bottom-right margin-m"
            onClick={() => closeModal(!showDatePicker)}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * The DayPicker library works with Dates that point to the noon
 * in the local timezone of the browser. This function converts a
 * string in form "2022-01-30" into a Date object.
 */
export function storedDateToLocalNoon(dateString: string): Date {
  const dateSplit = (/^(\d\d\d\d)-(\d\d)-(\d\d)$/).exec(dateString);
  if (!dateSplit) {
    throw new Error("Invalid exception date " + dateString);
  }
  const year = parseInt(dateSplit[1]);
  const month = parseInt(dateSplit[2]);
  const day = parseInt(dateSplit[3]);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export default ExceptionsDatePicker;
