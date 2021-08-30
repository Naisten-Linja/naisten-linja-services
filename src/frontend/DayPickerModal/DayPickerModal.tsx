import React from 'react';
import DayPicker from 'react-day-picker';
import Modal from 'react-modal';
import 'react-day-picker/lib/style.css';
import { useField } from 'formik';
import { BookingTypeException } from '../../common/constants-common';
import { DateUtils } from 'react-day-picker';
import { formatISO } from 'date-fns';

interface DayPickerModalProps {
  showDatePicker: boolean;
  closeModal: (b: boolean) => void;
}

const DayPickerModal: React.FC<DayPickerModalProps> = ({ showDatePicker, closeModal }) => {
  Modal.setAppElement('#root');

  const [{ value: exceptions }, , { setValue }] = useField('exceptions');
  const dateExceptions = exceptions.map((item: BookingTypeException) => new Date(item.date));

  const handleDayClick = (day: Date, { selected }: any) => {
    let newExceptions = [...exceptions] as Array<BookingTypeException>;

    if (selected) {
      const selectedIndex = exceptions.findIndex((selectedItem: any) =>
        DateUtils.isSameDay(new Date(selectedItem.date), day),
      );
      newExceptions.splice(selectedIndex, 1);
    } else {
      newExceptions.push({
        date: formatISO(day),
        enabled: false,
        slots: { enabled: false, slots: [] },
      });
    }

    setValue(newExceptions);
  };

  return (
    <Modal
      isOpen={showDatePicker}
      contentLabel="Choose exeptions"
      onRequestClose={() => closeModal(!showDatePicker)}
      style={{
        overlay: {
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        content: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: ' translate(-50%, -50%)',
          border: '1px solid #ccc',
          background: '#fff',
          overflow: 'auto',
          borderRadius: '4px',
          outline: 'none',
          padding: '20px',
          minHeight: '30rem',
          maxWidth: '30rem',
        },
      }}
    >
      <div className="height-100 text-align-center">
        <h1 className="font-weight-semibold">Choose exceptions</h1>

        <div className="flex-column">
          <div>
            <DayPicker
              selectedDays={dateExceptions}
              onDayClick={handleDayClick}
              disabledDays={[{ before: new Date() }]}
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

export default DayPickerModal;
