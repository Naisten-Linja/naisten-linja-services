import React from 'react';
import moment from 'moment-timezone';
import { IoMdCreate, IoMdTrash } from 'react-icons/io';
import { BookingTypeDateRange } from '../../../common/constants-common';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

interface BookingTypeBadgeDateRangeProps {
  range: BookingTypeDateRange;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BookingTypeBadgeDateRange = (props: BookingTypeBadgeDateRangeProps) => {
  const { t } = useTranslation(namespaces.pages.bookingTypes);

  const { start, end } = props.range;
  const { onEdit, onDelete } = props;

  const startFormatted = moment(start).format('DD.MM.yyyy');
  const endFormatted = moment(end).format('DD.MM.yyyy');

  const getText = () => {
    if (start === null && end === null) {
      return t('badge_date_range.always');
    } else if (start === null) {
      return t('badge_date_range.until', { endDate: endFormatted });
    } else if (end === null) {
      return t('badge_date_range.forever_after', { startDate: startFormatted });
    } else if (start === end) {
      return t('badge_date_range.only', { startDate: startFormatted });
    } else {
      return t('badge_date_range.from_to', { startDate: startFormatted, endDate: endFormatted });
    }
  };

  return (
    <p
      className="font-weight-semibold no-margin no-padding background-info-100 border-radius"
      style={{ fontSize: '0.75em' }}
    >
      <span className="display-inline-block padding-xxs" style={{ verticalAlign: 'middle' }}>
        {getText()}
      </span>
      {onEdit && (
        <button
          className="button button-xs button-primary button button-icon no-margin no-border-radius"
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
        >
          <IoMdCreate />
          <span>{t('badge_date_range.edit')}</span>
        </button>
      )}
      {onDelete && (
        <button
          className="button button-xs button-error button-square button button-icon no-margin"
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          title={t('badge_date_range.delete')}
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
