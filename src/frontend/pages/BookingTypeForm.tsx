import React from 'react';
import { Formik, Form, Field, FieldArray } from 'formik';

import {
  ApiBookingType,
  ApiBookingTypeParamsAdmin,
  weekDays,
  BookingTypeDailyRules,
  BookingSlot,
  BookingTypeException,
} from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';

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
  const { postRequest } = useRequest();
  const { addNotification } = useNotifications();

  const initialFormValue: ApiBookingTypeParamsAdmin = bookingType
    ? { name: bookingType.name, rules: bookingType.rules, exceptions: bookingType.exceptions }
    : {
        name: '',
        rules: [0, 1, 2, 3, 4, 5, 6].map(() => ({
          enabled: true,
          slots: [] as Array<BookingSlot>,
        })) as BookingTypeDailyRules,
        exceptions: [] as Array<BookingTypeException>,
      };

  const createNewBookingType = async (bookingType: ApiBookingTypeParamsAdmin) => {
    try {
      await postRequest('/api/booking-types', bookingType, {
        useJwt: true,
      });
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to create booking type' });
    }
  };

  return (
    <Formik
      initialValues={initialFormValue}
      onSubmit={async (values) => {
        if (!bookingType) {
          await createNewBookingType(values);
        }
        if (onSubmitCallback) {
          onSubmitCallback();
        }
      }}
    >
      {({ values }) => {
        const { rules } = values;
        return (
          <Form>
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
                      className="input-s font-weight-bold"
                      placeholder="Booking type name"
                      type="text"
                      name="name"
                      required
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
                  <tr>
                    <th className="font-size-s font-weight-semibold">{weekDays[idx]}</th>
                    <td key={`rule-${idx}`}>
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
          </Form>
        );
      }}
    </Formik>
  );
};
