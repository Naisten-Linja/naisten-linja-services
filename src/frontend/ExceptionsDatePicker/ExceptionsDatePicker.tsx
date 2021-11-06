import React from 'react';
import DayPicker, { DateUtils } from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import { useField } from 'formik';
import { formatISO } from 'date-fns';
import { SlotBookingRules } from '../../common/constants-common';
import Modal from '../ui-components/Modal/Modal';

interface ExceptionsDatePickerProps {
  showDatePicker: boolean;
  closeModal: (b: boolean) => void;
}

const ExceptionsDatePicker: React.FC<ExceptionsDatePickerProps> = ({
  showDatePicker,
  closeModal,
}) => {
  const [{ value: exceptions }, , { setValue }] = useField('exceptions');
  const [{ value: rules }] = useField('rules');
  const dateExceptions = exceptions.map(
    (exceptionDateString: string) => new Date(exceptionDateString),
  );

  const handleDayClick = (day: Date, { selected }: any) => {
    let newExceptions = [...exceptions] as Array<string>;

    if (selected) {
      const selectedIndex = exceptions.findIndex((selectedItem: any) =>
        DateUtils.isSameDay(new Date(selectedItem.date), day),
      );
      newExceptions.splice(selectedIndex, 1);
    } else {
      newExceptions.push(formatISO(day));
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
              selectedDays={dateExceptions}
              onDayClick={handleDayClick}
              disabledDays={[{ before: new Date() }, { daysOfWeek: getDisabledDays() }]}
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
