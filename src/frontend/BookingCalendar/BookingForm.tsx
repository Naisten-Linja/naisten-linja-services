import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment';
import { Formik, Form, Field } from 'formik';
import '@reach/dialog/styles.css';

import {
  ApiCreateBookingParams,
  ApiBooking,
  UserRole,
  ApiUserData,
} from '../../common/constants-common';
import { useAuth } from '../AuthContext';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';
import { BookingSlotDetails } from './shared-constants';

type BookingFormProps = BookingSlotDetails & {
  dismissModal: () => void;
  afterSubmit: () => void;
};

export const BookingForm: React.FC<BookingFormProps> = ({
  dismissModal,
  afterSubmit,
  start,
  end,
  bookingTypeUuid,
  bookingTypeName,
  availableSeats,
  seats,
}) => {
  const { user } = useAuth();
  const { postRequest, getRequest } = useRequest();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<Array<ApiUserData>>([]);

  useEffect(() => {
    let updateStateAfterFetch = true;
    const fetchUsers = async () => {
      try {
        const result = await getRequest<{ data: Array<ApiUserData> }>('/api/users', {
          useJwt: true,
        });
        if (result.data.data && updateStateAfterFetch) {
          setUsers(result.data.data);
        }
      } catch (err) {
        addNotification({ type: 'error', message: 'Unable to fetch users' });
      }
    };
    if (user?.role === UserRole.staff) {
      fetchUsers();
    }
    return () => {
      updateStateAfterFetch = false;
    };
  }, [user?.role, addNotification, setUsers, getRequest]);

  const createNewBooking = useCallback(
    async ({
      fullName,
      phone,
      email,
      userUuid,
      bookingTypeUuid,
      start,
      end,
    }: ApiCreateBookingParams) => {
      try {
        await postRequest<{ data: ApiBooking }>(
          '/api/bookings',
          {
            fullName,
            phone,
            email,
            userUuid,
            bookingTypeUuid,
            start,
            end,
          },
          {
            useJwt: true,
          },
        );
        addNotification({ type: 'success', message: 'New booking made' });
        dismissModal();
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: 'Unable to make new booking' });
        dismissModal();
      }
    },
    [addNotification, dismissModal, postRequest],
  );

  if (!user) {
    return null;
  }
  const { fullName, email } = user;
  const initialFormValues: ApiCreateBookingParams = {
    bookingTypeUuid,
    email,
    fullName: fullName || '',
    start: start.toString(),
    end: end.toString(),
    userUuid: user.uuid,
    phone: '',
  };
  const isPastSlot = moment().isAfter(end);

  return (
    <>
      <h2>Reserve a slot</h2>
      <h3>{bookingTypeName}</h3>
      <p>
        <b>Date:</b> {start.format('dddd MMMM YYYY')}
      </p>
      <p>
        <b>Time:</b> {start.format('HH:mm')} - {end.format('HH:mm')}
      </p>
      <p>
        <b>Seats:</b> {availableSeats} / {seats}
      </p>
      {availableSeats < 1 && <p>This slot is fully booked</p>}

      {isPastSlot && <p>This slot has ended.</p>}

      {availableSeats > 0 && !isPastSlot && (
        <Formik
          onSubmit={async (values) => {
            await createNewBooking(values);
            afterSubmit();
          }}
          initialValues={initialFormValues}
        >
          {({ setFieldValue }) => (
            <Form>
              {user.role === UserRole.staff && (
                <>
                  <label htmlFor="booking-details-user-uuid">
                    Create a booking for another user
                  </label>
                  <Field
                    type="text"
                    name="userUuid"
                    id="booking-details-user-uuid"
                    defaultValue={user.uuid}
                    required
                    as="select"
                    // @ts-ignore
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(e) => {
                          const selectedUser = users.find((u) => u.uuid === e.target.value);
                          if (selectedUser) {
                            setFieldValue('email', selectedUser.email);
                            setFieldValue('fullName', selectedUser.fullName || '');
                          }
                          field.onChange(e);
                        }}
                      >
                        {users.map((u) => (
                          <option value={u.uuid} key={u.uuid}>
                            {u.email}
                            {u.fullName ? ` - ${u.fullName}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  ></Field>
                </>
              )}
              <label htmlFor="booking-details-full-name">Full name</label>
              <Field type="text" name="fullName" id="booking-details-full-name" required />
              <label htmlFor="booking-details-email">Email</label>
              <Field type="text" name="email" id="booking-details-email" required />
              <label htmlFor="booking-details-phone">Phone</label>
              <Field type="text" name="phone" id="booking-details-phone" required />
              <input className="button button-primary" type="submit" value="Book the slot" />
              <button className="button width-100" type="button" onClick={dismissModal}>
                Cancel
              </button>
            </Form>
          )}
        </Formik>
      )}
    </>
  );
};
