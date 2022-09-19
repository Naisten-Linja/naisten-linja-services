import React, { useState, useEffect, useCallback } from 'react';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import { ApiBookingType, weekDays } from '../../../common/constants-common';
import { useRequest } from '../../shared/http';
import { useNotifications } from '../../NotificationsContext';
import { BookingTypeForm } from './BookingTypeForm';
import { BookingTypeBadgeDateRange } from './BookingTypeBadgeDateRange';
import { BookingTypeBadgeException } from './BookingTypeBadgeException';

export const BookingTypes: React.FC = () => {
  const { t } = useTranslation(namespaces.pages.bookingTypes);

  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingType>>([]);
  const [editStates, setEditStates] = useState<Record<string, boolean>>({});
  const { getRequest } = useRequest();
  const { addNotification } = useNotifications();

  const fetchBookingTypes = useCallback(async () => {
    try {
      const bookingTypesResult = await getRequest<{ data: Array<ApiBookingType> }>(
        '/api/booking-types',
        { useJwt: true },
      );
      const result = bookingTypesResult.data.data;
      setBookingTypes(result);
      setEditStates(
        result.reduce(
          (acc, bookingType) => ({
            ...acc,
            [bookingType.uuid]: false,
          }),
          {},
        ),
      );
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: t('booking_types.fetch_booking_types_error') });
    }
  }, [getRequest, addNotification, t]);

  useEffect(() => {
    if (!isCreatingNew) {
      fetchBookingTypes();
    }
  }, [fetchBookingTypes, isCreatingNew]);

  const editCallback = useCallback(
    (bookingType: ApiBookingType) => async () => {
      await fetchBookingTypes();
      setEditStates({ ...editStates, [bookingType.uuid]: false });
    },
    [fetchBookingTypes, setEditStates, editStates],
  );

  if (isCreatingNew) {
    return (
      <div className="container">
        <h1>{t('booking_types.new_booking_type')}</h1>
        <BookingTypeForm
          onSubmitCallback={() => setIsCreatingNew(false)}
          onCancelCallback={() => setIsCreatingNew(false)}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{t('booking_types.title')}</h1>
      <button
        className="button button-info button-m margin-bottom-l"
        onClick={() => setIsCreatingNew(true)}
      >
        {t('booking_types.button.create_booking_type')}
      </button>
      {bookingTypes.map((bookingType) => {
        const isEditing = editStates[bookingType.uuid];
        const { rules, uuid, name, exceptions, dateRanges, additionalInformation } = bookingType;
        return (
          <div className="margin-bottom-l" key={uuid}>
            {isEditing ? (
              <BookingTypeForm
                bookingType={bookingType}
                onSubmitCallback={editCallback(bookingType)}
                onCancelCallback={editCallback(bookingType)}
              />
            ) : (
              <table className="table-responsive ">
                <thead>
                  <tr>
                    <td>
                      <button
                        className="button button-xxs button-info width-100"
                        onClick={() =>
                          setEditStates({
                            ...editStates,
                            [uuid]: !isEditing,
                          })
                        }
                      >
                        {t('booking_types.button.edit')}
                      </button>
                    </td>
                    <td className="font-weight-bold font-size-xl">{name}</td>
                  </tr>
                  {additionalInformation && (
                    <tr>
                      <th className="font-weight-semibold font-size-s" style={{ width: '7rem' }}>
                        {t('booking_types.additional_information')}
                      </th>
                      <td className="font-weight-semibold font-size-s">
                        <div
                          key="additional-information"
                          className="display-inline-block border-radius background-success-100 padding-xxs font-size-xs font-weight-semibold"
                        >
                          {additionalInformation}
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th className="font-weight-semibold font-size-s" style={{ width: '7rem' }}>
                      {t('booking_types.active_date_ranges')}
                    </th>
                    <td className="font-weight-semibold font-size-s">
                      {dateRanges.length === 0 ? (
                        <p className="font-size-xs color-error">
                          {t('booking_types.no_date_selected')}
                        </p>
                      ) : (
                        <ul className="list-unstyled">
                          {dateRanges.map((range, idx) => (
                            <li
                              className="display-inline-block margin-right-xxs"
                              key={`exception.${idx}`}
                            >
                              <BookingTypeBadgeDateRange range={range} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="font-weight-semibold font-size-s" style={{ width: '7rem' }}>
                      {t('booking_types.exceptions')}
                    </th>
                    <td className="font-weight-semibold font-size-s">
                      <ul className="list-unstyled">
                        {exceptions.map((exceptionDateString, idx) => (
                          <li
                            className="display-inline-block margin-right-xxs"
                            key={`exception.${idx}`}
                          >
                            <BookingTypeBadgeException dateString={exceptionDateString} />
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th className="font-weight-semibold" style={{ width: '7rem' }}>
                      {t('booking_types.week_day')}
                    </th>
                    <th className="font-weight-semibold">{t('booking_types.slots')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map(({ slots = [] }, idx) => (
                    <tr key={idx}>
                      <th> {weekDays[idx]}</th>
                      <td key={idx}>
                        {slots.length > 0
                          ? slots.map((slot, idx) => (
                              <div
                                key={`slot-${idx}`}
                                className="display-inline-block border-radius background-info-100 padding-xxs margin-xxs font-size-xs font-weight-semibold"
                              >
                                {`${slot.start} - ${slot.end}; ${t(
                                  'booking_types.available_seats',
                                )}: ${slot.seats}`}
                              </div>
                            ))
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
};
