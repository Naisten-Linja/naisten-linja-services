import React, { useState, useEffect, useCallback } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Formik, Form, Field } from 'formik';

import {
  ApiBookingType,
  weekDays,
  BookingTypeDailyRules,
  BookingSlot,
  BookingTypeException,
} from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';

export const BookingTypes: React.FunctionComponent<RouteComponentProps> = () => {
  const [bookingTypes, setBookingTypes] = useState<Array<ApiBookingType>>([]);
  const [editStates, setEditStates] = useState<Record<string, boolean>>({});
  const { getRequest, postRequest } = useRequest();
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
      addNotification({ type: 'error', message: 'Unable to get all booking types' });
    }
  }, [addNotification, setBookingTypes, getRequest]);

  useEffect(() => {
    fetchBookingTypes();
  }, [fetchBookingTypes]);

  const createNewBookingType = async () => {
    try {
      await postRequest('/api/booking-types', onlineBooking, {
        useJwt: true,
      });
    } catch (err) {
      console.log(err);
      addNotification({ type: 'error', message: 'Unable to create booking type' });
    }
  };

  return (
    <>
      <h1>Booking types</h1>
      <button onClick={createNewBookingType}>Create booking</button>
      {bookingTypes.map((bookingType) => {
        const isEditing = editStates[bookingType.uuid];
        return (
          <div className="container" key={bookingType.uuid}>
            <h3>{bookingType.name}</h3>
            <button
              onClick={() =>
                setEditStates({
                  ...editStates,
                  [bookingType.uuid]: !isEditing,
                })
              }
            >
              Edit
            </button>
            {isEditing ? (
              <BookingTypeForm bookingType={bookingType} />
            ) : (
              <table className="table-responsive">
                <thead>
                  <tr>
                    {weekDays.map((day, idx) => (
                      <th key={idx} style={{ width: `calc(100% / 7)` }}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {bookingType.rules.map(({ disabled, slots = [] }, idx) => (
                      <td key={idx}>
                        {disabled
                          ? ''
                          : slots.length > 0
                          ? slots.map((slot, idx) => (
                              <p key={`slot-${idx}`}>
                                {`${slot.start}-${slot.end}. Seats: ${slot.seats}`}
                              </p>
                            ))
                          : ''}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        );
      })}
      <BookingTypeForm />
    </>
  );
};

interface BookingTypeFormProps {
  bookingType?: ApiBookingType;
}

export const BookingTypeForm: React.FC<BookingTypeFormProps> = ({ bookingType }) => {
  const initialFormValue: ApiBookingType = bookingType
    ? bookingType
    : {
        uuid: '',
        name: '',
        rules: [0, 1, 2, 3, 4, 5, 6].map(() => ({
          disabled: false,
          slots: [] as Array<BookingSlot>,
        })) as BookingTypeDailyRules,
        exceptions: [] as Array<BookingTypeException>,
      };

  return (
    <Formik initialValues={initialFormValue} onSubmit={() => {}}>
      {({ values }) => {
        const { rules } = values;
        return (
          <Form>
            <Field type="text" name="name" required />
            <table className="table-responsive">
              <thead>
                <tr>
                  {weekDays.map((day, idx) => (
                    <th key={idx} style={{ width: `calc(100% / 7)` }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((r, idx) => (
                  <td key={`rule-${idx}`} style={{ width: `calc(100% / 7)` }}>
                    <label>
                      <Field type="checkbox" name={`rules.${idx}.disabled`} />
                      Disabled
                    </label>
                  </td>
                ))}
              </tbody>
            </table>
          </Form>
        );
      }}
    </Formik>
  );
};

const onlineBooking = {
  name: 'Online letter',
  exceptions: [],
  rules: [
    {
      disabled: false,
      slots: [
        {
          start: '7:30',
          end: '11:45',
          seats: 4,
        },
        {
          start: '12:30',
          end: '14:30',
          seats: 4,
        },
      ],
    },
    {
      disabled: true,
      slots: [],
    },
    {
      disabled: false,
      slots: [
        {
          start: '7:30',
          end: '11:45',
          seats: 4,
        },
        {
          start: '12:30',
          end: '14:30',
          seats: 4,
        },
      ],
    },
    {
      disabled: true,
      slots: [],
    },
    {
      disabled: false,
      slots: [
        {
          start: '7:30',
          end: '11:45',
          seats: 4,
        },
        {
          start: '12:30',
          end: '14:30',
          seats: 4,
        },
      ],
    },
    {
      slots: [],
      disabled: true,
    },
    {
      slots: [],
      disabled: true,
    },
  ],
};
