import React, { useState, useCallback } from 'react';
import { Formik, Form, Field, FieldArray, useField, FieldHookConfig } from 'formik';

import {
  ApiBookingType,
  weekDays,
  BookingTypeDailyRules,
  BookingSlot,
  BookingTypeDateRange,
  SlotBookingRules,
} from '../../common/constants-common';

import { useNotifications } from '../NotificationsContext';
import ExceptionsDatePicker from '../ExceptionsDatePicker/ExceptionsDatePicker';
import { useRequest } from '../http';
import moment from 'moment-timezone';
import BookingTypeDateRangePicker from '../BookingTypeDateRangePicker/BookingTypeDateRangePicker';
import { IoMdCreate, IoMdTrain, IoMdTrash } from 'react-icons/io';


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
      rules: [0, 1, 2, 3, 4, 5, 6].map((): SlotBookingRules => ({
        enabled: true,
        slots: [],
      })) as BookingTypeDailyRules,
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
        await putRequest<{}>(
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
        const { rules, exceptions, dateRanges } = values;
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
                                <p className="font-size-xs no-margin padding-right-s">
                                  {moment(exceptionDateString).format('DD.MM.yyyy')}
                                </p>
                                <button
                                  className="button button-tertiary button-text button-xxs"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    arrayHelpers.remove(idx);
                                  }}
                                >
                                  Delete exception
                                </button>
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

interface BookingTypeDateRangesFieldProps {

};

const BookingTypeDateRangesField = (props: BookingTypeDateRangesFieldProps) => {
  const [{ value: dateRanges }, meta, helpers] = useField<Array<BookingTypeDateRange>>("dateRanges");
  const [editRangeIndex, setEditRangeIndex] = useState<number | null>(null);

  const closePickerModal = () => {
    setEditRangeIndex(null);
  }

  return <>
    <FieldArray
      name="dateRanges"
      render={(arrayHelpers) => <>
        {(dateRanges.length === 0)
          ? <p className="font-size-xs color-error">No date ranges selected, this booking type is never available.</p>
          : (
            <ul className="list-unstyled">
              {
                dateRanges.map((range, idx) => (
                  <li
                    className="display-inline-block margin-right-xxs"
                    key={`exception.${idx}`}
                  >
                    <p className="font-size-m no-margin padding-right-s">
                      <BookingTypeDateRangeBadge
                        range={range}
                        onEdit={() => setEditRangeIndex(idx)}
                        onDelete={() => arrayHelpers.remove(idx)}
                      />
                    </p>
                  </li>
                ))
              }
              <BookingTypeDateRangePicker
                value={(editRangeIndex !== null)
                  ? dateRanges[editRangeIndex]
                  : null
                }
                onChange={(newValue) => {
                  if (editRangeIndex !== null) {
                    arrayHelpers.replace(editRangeIndex, newValue)
                  }
                }}
                onClose={() => {
                  setEditRangeIndex(null);
                }}
              />
            </ul>
          )}
        <div>
          <button
            onClick={(e) => {
              e.preventDefault();
              const prevLength = dateRanges.length;
              arrayHelpers.push({ start: null, end: null });
              setEditRangeIndex(prevLength);
            }}
            className="button-xxs success"
          >
            Add date range
          </button>
        </div>
      </>}
    />
  </>;
}

interface BookingTypeDateRangeBadgeProps {
  range: BookingTypeDateRange;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BookingTypeDateRangeBadge = (props: BookingTypeDateRangeBadgeProps) => {
  const { start, end } = props.range;
  const { onEdit, onDelete } = props;

  const startFormatted = moment(start).format('DD.MM.yyyy');
  const endFormatted = moment(end).format('DD.MM.yyyy');

  const getText = () => {
    if (start === null && end === null) {
      return "Always";
    } else if (start === null) {
      return `Always until ${endFormatted}`;
    } else if (end === null) {
      return `Forever after ${startFormatted}`;
    } else if (start === end) {
      return `Only on ${startFormatted}`;
    } else {
      return `From ${startFormatted} to ${endFormatted}`;
    }
  }

  // className="border-radius background-error-50 padding-xxs font-size-xxs font-weight-semibold"
  return (
    <p className="font-weight-semibold no-margin no-padding background-info-100 border-radius" style={{ fontSize: '0.8em' }}>
      <span className="padding-xxs padding-right-s">
        {getText()}
      </span>
      {onEdit &&
        <button
          className="button button-xs button-primary button button-icon no-margin no-border-radius"
          onClick={(e) => {
            e.preventDefault();
            onEdit();
          }}
        >
          <IoMdCreate />
          <span>EDIT</span>
        </button>
      }
      {onDelete &&
        <button
          className="button button-xs button-error button-square button button-icon no-margin"
          style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          <IoMdTrash />
        </button>
      }
    </p>
  )
}