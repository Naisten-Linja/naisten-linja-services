import React, { useState, useCallback } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import {
  ApiBookingType,
  weekDays,
  BookingTypeDailyRules,
  BookingTypeDateRange,
  SlotBookingRules,
} from '../../../common/constants-common';

import { useNotifications } from '../../NotificationsContext';
import ExceptionsDatePicker from './ExceptionsDatePicker/ExceptionsDatePicker';
import { useRequest } from '../../shared/http';
import { BookingTypeDateRangesField } from './BookingTypeDateRangesField';
import { BookingTypeBadgeException } from './BookingTypeBadgeException';

export interface BookingTypeFormValue {
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  dateRanges: Array<BookingTypeDateRange>;
  additionalInformation: string | null;
  flexibleLocation: boolean;
}

interface BookingTypeFormProps {
  bookingType?: ApiBookingType;
  onSubmitCallback?: () => void;
  onCancelCallback?: () => void;
}

export const BookingTypeForm: React.FC<BookingTypeFormProps> = ({
  bookingType,
  onSubmitCallback,
  onCancelCallback,
}) => {
  const { t } = useTranslation(namespaces.pages.bookingTypes);

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const { postRequest, putRequest } = useRequest();
  const { addNotification } = useNotifications();

  const initialFormValue: BookingTypeFormValue = bookingType
    ? {
        name: bookingType.name,
        rules: bookingType.rules,
        exceptions: bookingType.exceptions,
        dateRanges: bookingType.dateRanges,
        additionalInformation: bookingType.additionalInformation || '',
        flexibleLocation: bookingType.flexibleLocation,
      }
    : {
        name: '',
        rules: [0, 1, 2, 3, 4, 5, 6].map(
          (): SlotBookingRules => ({
            enabled: true,
            slots: [],
          }),
        ) as BookingTypeDailyRules,
        exceptions: [],
        dateRanges: [{ start: null, end: null }],
        additionalInformation: '',
        flexibleLocation: true,
      };

  const createNewBookingType = async (bookingType: BookingTypeFormValue) => {
    try {
      await postRequest(
        '/api/booking-types',
        { ...bookingType, additionalInformation: bookingType.additionalInformation || null },
        {
          useJwt: true,
        },
      );
    } catch (err) {
      console.log(err);
      addNotification({
        type: 'error',
        message: t('booking_type_form.create_new_booking_type_error'),
      });
    }
  };

  const updateBookingType = useCallback(
    async ({
      uuid,
      name,
      rules,
      exceptions,
      dateRanges,
      additionalInformation,
      flexibleLocation,
    }: BookingTypeFormValue & { uuid: string }) => {
      if (!uuid) {
        return;
      }
      try {
        await putRequest<unknown>(
          `/api/booking-types/${uuid}`,
          { name, rules, exceptions, dateRanges, additionalInformation, flexibleLocation },
          {
            useJwt: true,
          },
        );
      } catch (err) {
        console.log(err);
        addNotification({
          type: 'error',
          message: t('booking_type_form.update_booking_type_error'),
        });
      }
    },
    [addNotification, putRequest, t],
  );

  return (
    <Formik
      initialValues={initialFormValue}
      onSubmit={async (values) => {
        if (!bookingType) {
          await createNewBookingType(values);
        } else {
          await updateBookingType({ uuid: bookingType.uuid, ...values });
        }
        if (onSubmitCallback) {
          onSubmitCallback();
        }
      }}
    >
      {({ values }) => {
        const { rules, exceptions } = values;
        const filledRules = rules.filter(({ slots }) => {
          const filledSlots = slots.filter(
            ({ start, end, seats }) => start !== '' && end !== '' && seats > 0,
          );
          return filledSlots.length > 0;
        });
        return (
          <Form id="form">
            <table className="table-responsive">
              <thead>
                <tr>
                  <td>
                    <button
                      className="button button-border button-xxs width-100"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onCancelCallback) {
                          onCancelCallback();
                        }
                      }}
                    >
                      {t('booking_type_form.button.cancel')}
                    </button>
                    <input
                      type="submit"
                      className="button button-xxs button-secondary width-100"
                      value={t('booking_type_form.button.save')}
                    />
                  </td>
                  <td>
                    <Field
                      aria-label={t('booking_type_form.booking_type_name')}
                      className="input-s font-weight-bold"
                      placeholder={t('booking_type_form.booking_type_name')}
                      type="text"
                      name="name"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th className="font-weight-semibold font-size-s">
                    {t('booking_type_form.active_date_ranges')}
                  </th>
                  <td className="font-weight-semibold font-size-s">
                    <BookingTypeDateRangesField />
                  </td>
                </tr>

                <tr>
                  <th className="font-weight-semibold font-size-s">
                    {t('booking_type_form.allow_flexible_location')}
                  </th>
                  <td>
                    <Field
                      aria-label={t('booking_type_form.allow_flexible_location')}
                      name="flexibleLocation"
                      type="checkbox"
                    />
                  </td>
                </tr>

                <tr>
                  <th className="font-weight-semibold font-size-s">
                    {t('booking_type_form.exceptions')}
                  </th>
                  <td className="font-weight-semibold font-size-s">
                    {exceptions.length > 0 && (
                      <ul className="list-unstyled">
                        <FieldArray
                          name="exceptions"
                          render={(arrayHelpers) =>
                            exceptions.map((exceptionDateString, idx) => (
                              <li
                                className="display-inline-block margin-right-xxs"
                                key={`exception.${idx}`}
                              >
                                <BookingTypeBadgeException
                                  dateString={exceptionDateString}
                                  onDelete={() => {
                                    arrayHelpers.remove(idx);
                                  }}
                                />
                              </li>
                            ))
                          }
                        />
                      </ul>
                    )}
                    <div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowDatePicker(!showDatePicker);
                        }}
                        className="button-xxs success"
                        disabled={filledRules.length === 0}
                      >
                        {t('booking_type_form.add_exceptions')}
                      </button>
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="font-weight-semibold font-size-s">
                    {t('booking_type_form.additional_information')}
                  </th>
                  <td className="font-weight-semibold font-size-s">
                    <Field
                      aria-label={t('booking_type_form.additional_information')}
                      placeholder={t('booking_type_form.additional_information')}
                      className="input-s"
                      name="additionalInformation"
                      type="text"
                    />
                  </td>
                </tr>

                <tr>
                  <th className="font-weight-semibold font-size-s" style={{ width: '7rem' }}>
                    {t('booking_type_form.week_day')}
                  </th>
                  <th className="font-weight-semibold font-size-s">
                    {t('booking_type_form.slots')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((_, idx) => (
                  <tr key={`rule-${idx}`}>
                    <th className="font-size-s font-weight-semibold">{weekDays[idx]}</th>
                    <td>
                      <FieldArray
                        name={`rules.${idx}.slots`}
                        render={(arrayHelpers) => (
                          <>
                            {rules[idx].slots.map((_, slotIdx) => (
                              <div key={`slot-${slotIdx}`}>
                                <div className="group group-xxs group-space-between group-stretch max-width-xs">
                                  <ul>
                                    <li>
                                      <label
                                        htmlFor={`rules.${idx}.slots.${slotIdx}.start`}
                                        className="font-size-xxs"
                                      >
                                        {t('booking_type_form.start')}
                                      </label>
                                      <Field
                                        aria-label={t('booking_type_form.start')}
                                        className="input-xxs"
                                        name={`rules.${idx}.slots.${slotIdx}.start`}
                                        type="text"
                                      />
                                    </li>
                                    <li>
                                      <label
                                        htmlFor={`rules.${idx}.slots.${slotIdx}.end`}
                                        className="font-size-xxs"
                                      >
                                        {t('booking_type_form.end')}
                                      </label>
                                      <Field
                                        aria-label={t('booking_type_form.end')}
                                        className="input-xxs"
                                        name={`rules.${idx}.slots.${slotIdx}.end`}
                                        type="text"
                                      />
                                    </li>
                                    <li>
                                      <label
                                        htmlFor={`rules.${idx}.slots.${slotIdx}.seats`}
                                        className="font-size-xxs"
                                      >
                                        {t('booking_type_form.seats')}:{' '}
                                      </label>
                                      <Field
                                        aria-label={t('booking_type_form.seats')}
                                        className="input-xxs"
                                        name={`rules.${idx}.slots.${slotIdx}.seats`}
                                        type="number"
                                      />
                                    </li>
                                  </ul>
                                </div>

                                <button
                                  className="button button-tertiary button-text button-xxs margin-bottom-xs"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    arrayHelpers.remove(slotIdx);
                                  }}
                                >
                                  {t('booking_type_form.button.delete_slot')}
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                arrayHelpers.push({ start: '', end: '', seats: 0 });
                              }}
                              className="button-xxs success"
                              data-testid={`add-slot-button-${weekDays[idx]}`}
                            >
                              {t('booking_type_form.button.add_slot')}
                            </button>
                          </>
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {showDatePicker && (
              <ExceptionsDatePicker
                showDatePicker={showDatePicker}
                closeModal={setShowDatePicker}
              />
            )}
          </Form>
        );
      }}
    </Formik>
  );
};
