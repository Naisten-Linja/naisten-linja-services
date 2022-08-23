import React from 'react';
import moment from 'moment-timezone';
import { IoMdTrash } from 'react-icons/io';

interface BookingTypeBadgeExceptionProps {
  dateString: string;
  onDelete?: () => void;
}

export const BookingTypeBadgeException = (props: BookingTypeBadgeExceptionProps) => {
  const { dateString, onDelete } = props;

  const formatted = moment(dateString).format('DD.MM.yyyy');

  return (
    <p
      className="font-weight-semibold no-margin no-padding background-error-50 border-radius"
      style={{ fontSize: '0.75em' }}
    >
      <span className="display-inline-block padding-xxs" style={{ verticalAlign: 'middle' }}>
        {formatted}
      </span>
      {onDelete && (
        <button
          className="button button-xs button-error button-square button button-icon no-margin"
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          title="Delete this exception"
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          <IoMdTrash />
        </button>
      )}
    </p>
  );
};
