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
  const dateExceptions = exceptions.map(
    (exceptionDateString: string) => new Date(exceptionDateString),
  );

  const handleDayClick = (day: Date, { selected, disabled }: DayModifiers) => {
    if (disabled) {
      return;
    }

    const newExceptions = [...exceptions];

    if (selected) {
      const selectedIndex = exceptions.findIndex((selectedItem) =>
        DateUtils.isSameDay(new Date(selectedItem), day),
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

export default ExceptionsDatePicker;