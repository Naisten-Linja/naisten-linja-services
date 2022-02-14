import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment-timezone';
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
  ownBookings: Array<ApiBooking>;
};

export const BookingForm: React.FC<BookingFormProps> = ({
  dismissModal,
  afterSubmit,
  start,
  end,
  bookingTypeUuid,
  bookingTypeName,
  availableSeats,
  bookingTypeAdditionalInformation,
  ownBookings,
  seats,
}) => {
  const { user } = useAuth();
  const { postRequest, getRequest } = useRequest();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<Array<ApiUserData>>([]);

  const isReserved = !!ownBookings.find(
    ({ bookingType, ...booking }) =>
      bookingType.uuid === bookingTypeUuid &&
      moment(booking.start).isSame(moment(start)) &&
      moment(booking.end).isSame(moment(end)),
  );

  // These variables are only relevant if the user is a staff member
  const [allBookings, setAllBookings] = useState<Array<ApiBooking>>([]);
  const slotBookings = allBookings.filter(
    (booking) =>
      booking.bookingType.uuid === bookingTypeUuid &&
      moment(booking.start).isSame(start) &&
      moment(booking.end),
  );
  const reservedUserUuids = slotBookings.map(({ user }) => user.uuid);

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
    const fetchAllBookings = async () => {
      try {
        const result = await getRequest<{ data: Array<ApiBooking> }>('/api/bookings/all', {
          useJwt: true,
        });
        if (result.data.data && updateStateAfterFetch) {
          setAllBookings(result.data.data);
        }
      } catch (err) {
        addNotification({ type: 'error', message: 'Unable to fetch all bookings' });
      }
    };

    if (user?.role === UserRole.staff) {
      fetchUsers();
      fetchAllBookings();
    }

    return () => {
      updateStateAfterFetch = false;
    };
  }, [user?.role, addNotification, setUsers, setAllBookings, getRequest]);

  const createNewBooking = useCallback(
    async ({
      fullName,
      phone,
      email,
      userUuid,
      bookingTypeUuid,
      bookingNote,
      start,
      end,
      workingRemotely,
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
            bookingNote,
            start,
            end,
            workingRemotely,
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
  const initialFormValues: Omit<ApiCreateBookingParams, 'workingRemotely'> & {
    workingRemotely: 'true' | 'false';
  } = {
    bookingTypeUuid,
    email,
    fullName: fullName || '',
    start: start.toString(),
    end: end.toString(),
    userUuid: user.uuid,
    bookingNote: '',
    phone: '',
    workingRemotely: 'false',
  };
  const isPastSlot = moment().isAfter(end);

  return (
    <>
      <h2>Reserve a slot</h2>
      <h3>{bookingTypeName}</h3>
      {isPastSlot && (
        <p>
          <b>This slot has ended.</b>
        </p>
      )}
      {!!bookingTypeAdditionalInformation && <p>{bookingTypeAdditionalInformation}</p>}
      <p>
        <b>Date:</b> {start.format('dddd Do MMMM YYYY')}
      </p>
      <p>
        <b>Time:</b> {start.format('HH:mm')} - {end.format('HH:mm')}
      </p>
      <p>
        <b>Seats:</b> {availableSeats} / {seats}
      </p>

      {availableSeats < 1 && <p>This slot is fully booked</p>}
      {isReserved && (
        <p>
          <b>You already booked this slot!</b>
        </p>
      )}

      {availableSeats > 0 && !(isReserved && user.role === UserRole.volunteer) && !isPastSlot && (
        <Formik
          onSubmit={async (values) => {
            await createNewBooking({
              ...values,
              workingRemotely: values.workingRemotely === 'true',
            });
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
                        {users
                          .filter((u) => !reservedUserUuids.includes(u.uuid))
                          .map((u) => (
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
              <label id="booking-details-preferred-working-location-label">
                Preferred working location
              </label>
              <div role="group" aria-labelledby="booking-details-preferred-working-location-label">
                <label>
                  <Field type="radio" name="workingRemotely" value="false" />
                  From the office
                </label>
                <label>
                  <Field type="radio" name="workingRemotely" value="true" />
                  Remotely
                </label>
              </div>
              <label htmlFor="booking-details-booking-note">Note</label>
              <Field
                type="text"
                name="bookingNote"
                id="booking-details-booking-note"
                as="textarea"
              />
              <input className="button button-primary" type="submit" value="Book the slot" />
              <button className="button width-100" type="button" onClick={dismissModal}>
                Cancel
              </button>
            </Form>
          )}
        </Formik>
      )}

      {user?.role === UserRole.staff && slotBookings.length > 0 && (
        <>
          <h2>Reserved by:</h2>
          {slotBookings.map(({ uuid, user, fullName, email, phone }) => (
            <p key={uuid}>
              <b>User:</b> {user.email}
              <br />
              <b>Booking details:</b>
              <br />
              {fullName}
              <br />
              {email}
              <br />
              {phone}
            </p>
          ))}
        </>
      )}
    </>
  );
};
