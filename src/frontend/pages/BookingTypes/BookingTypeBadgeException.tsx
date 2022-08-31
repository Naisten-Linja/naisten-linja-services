import React from 'react';
import moment from 'moment-timezone';
import { IoMdTrash } from 'react-icons/io';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

interface BookingTypeBadgeExceptionProps {
  dateString: string;
  onDelete?: () => void;
}

export const BookingTypeBadgeException = (props: BookingTypeBadgeExceptionProps) => {
  const { t } = useTranslation(namespaces.pages.bookingTypes);

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
          title={t('badge_exception.delete')}
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
