import React from 'react';
import moment from 'moment-timezone';
import { IoMdCreate, IoMdTrash } from 'react-icons/io';
import { BookingTypeDateRange } from '../../../common/constants-common';

interface BookingTypeBadgeDateRangeProps {
  range: BookingTypeDateRange;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export const BookingTypeBadgeDateRange = (props: BookingTypeBadgeDateRangeProps) => {
  const { start, end } = props.range;
  const { onEdit, onDelete } = props;

  const startFormatted = moment(start).format('DD.MM.yyyy');
  const endFormatted = moment(end).format('DD.MM.yyyy');

  const getText = () => {
    if (start === null && end === null) {
      return 'Always';
    } else if (start === null) {
      return `Always until ${endFormatted}`;
    } else if (end === null) {
      return `Forever after ${startFormatted}`;
    } else if (start === end) {
      return `Only on ${startFormatted}`;
    } else {
      return `From ${startFormatted} to ${endFormatted}`;
    }
  };

  return (
    <p
      className={
        'font-weight-semibold no-margin no-padding background-info-100 border-radius ' +
        props.className
      }
      style={{ fontSize: '0.75em' }}
    >
      <span className="display-inline-block padding-xxs" style={{ verticalAlign: 'middle' }}>
        {getText()}
      </span>
      {onEdit && (
        <button
          className="button button-xs button-primary button button-icon no-margin no-border"
          style={
            typeof onDelete !== 'undefined'
              ? {
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                }
              : { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
          }
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
        >
          <IoMdCreate />
          <span>EDIT</span>
        </button>
      )}
      {onDelete && (
        <button
          className="button button-xs button-error button-square button button-icon no-margin no-border"
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          title="Delete this date range"
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
