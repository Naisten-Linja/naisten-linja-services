import React, { useState, useCallback } from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';

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
        dateRanges: [],
        additionalInformation: '',
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
      addNotification({ type: 'error', message: 'Unable to create booking type' });
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
    }: BookingTypeFormValue & { uuid: string }) => {
      if (!uuid) {
        return;
      }
      try {
        await putRequest<unknown>(
          `/api/booking-types/${uuid}`,
          { name, rules, exceptions, dateRanges, additionalInformation },
          {
            useJwt: true,
          },
        );
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'Unable to update booking type' });
      }
    },
    [addNotification, putRequest],
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
                      Cancel
                    </button>
                    <input
                      type="submit"
                      className="button button-xxs button-secondary width-100"
                      value="Save"
                    />
                  </td>
                  <td>
                    <Field
                      aria-label="booking type name"
                      className="input-s font-weight-bold"
                      placeholder="Booking type name"
                      type="text"
                      name="name"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th className="font-weight-semibold font-size-s">Active date ranges</th>
                  <td className="font-weight-semibold font-size-s">
                    <BookingTypeDateRangesField />
                  </td>
                </tr>

                <tr>
                  <th className="font-weight-semibold font-size-s">Exceptions</th>
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
                        Add exceptions
                      </button>
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="font-weight-semibold font-size-s">Additional information</th>
                  <td className="font-weight-semibold font-size-s">
                    <Field
                      aria-label="additional information"
                      placeholder="Additional information"
                      className="input-s"
                      name="additionalInformation"
                      type="text"
                    />
                  </td>
                </tr>

                <tr>
                  <th className="font-weight-semibold font-size-s" style={{ width: '7rem' }}>
                    Week day
                  </th>
                  <th className="font-weight-semibold font-size-s">Slots</th>
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
                                        Start
                                      </label>
                                      <Field
                                        aria-label="start date"
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
                                        End
                                      </label>
                                      <Field
                                        aria-label="end date"
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
                                        Seats:{' '}
                                      </label>
                                      <Field
                                        aria-label="seats"
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
                                  Delete slot
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
                              Add slot
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
