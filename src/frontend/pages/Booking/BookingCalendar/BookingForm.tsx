import React, { useCallback, useEffect, useState } from 'react';
import moment from 'moment-timezone';
import { Formik, Form, Field } from 'formik';
import Select from 'react-select';
import '@reach/dialog/styles.css';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../../i18n/i18n.constants';

import {
  ApiCreateBookingParams,
  ApiBooking,
  UserRole,
  ApiUserData,
} from '../../../../common/constants-common';
import { useAuth } from '../../../AuthContext';
import { useRequest } from '../../../shared/http';
import { useNotifications } from '../../../NotificationsContext';
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
  const { t } = useTranslation(namespaces.pages.bookingCalendar);

  const { user } = useAuth();
  const { postRequest, getRequest } = useRequest();
  const { addNotification } = useNotifications();
  const [users, setUsers] = useState<Array<ApiUserData>>([]);

  const isReserved = !!ownBookings.find(
    ({ bookingType, ...booking }) =>
      bookingType.uuid === bookingTypeUuid &&
      moment(booking.start).isSame(start) &&
      moment(booking.end).isSame(end),
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
        addNotification({ type: 'error', message: t('booking_form.fetch_users_error') });
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
        addNotification({ type: 'error', message: t('booking_form.fetch_all_bookings_error') });
      }
    };

    if (user?.role === UserRole.staff) {
      fetchUsers();
      fetchAllBookings();
    }

    return () => {
      updateStateAfterFetch = false;
    };
  }, [user?.role, addNotification, setUsers, setAllBookings, getRequest, t]);

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
        addNotification({ type: 'success', message: t('booking_form.create_new_booking_success') });
        dismissModal();
      } catch (err) {
        console.log(err);
        addNotification({ type: 'error', message: t('booking_form.create_new_booking_error') });
        dismissModal();
      }
    },
    [addNotification, dismissModal, postRequest, t],
  );

  if (!user) {
    return null;
  }
  const { fullName, email } = user;

  const unreservedUsers = users
    .filter((u) => !reservedUserUuids.includes(u.uuid))
    .map((u) => {
      // attach phone number for each user, fetched from their next booking
      const bookingsByUser = allBookings.filter((b) => b.user.uuid === u.uuid);
      return {
        ...u,
        phone: findPhoneNumberFromClosestBooking(bookingsByUser),
      };
    });
  const unreservedUserOptions = unreservedUsers
    .map((u) => ({
      value: u.uuid,
      label: `${u.fullName ? u.fullName + ' - ' : ''}${u.email}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // If the login user is already reserved, then default the dropdown to the first user on the list.
  const unreservedUser = unreservedUsers.find((u) => u.uuid === user.uuid) || unreservedUsers[0];

  let initialFormValues: Omit<ApiCreateBookingParams, 'workingRemotely'> & {
    workingRemotely: 'true' | 'false';
  } = {
    bookingTypeUuid,
    email,
    fullName: fullName || '',
    start: start.toString(),
    end: end.toString(),
    userUuid: user.uuid,
    bookingNote: '',
    phone: findPhoneNumberFromClosestBooking(ownBookings) || '',
    workingRemotely: 'false',
  };

  // For staff we have list of users available, update the initial value accordingly.
  if (unreservedUser) {
    initialFormValues = {
      ...initialFormValues,
      email: unreservedUser.email,
      fullName: unreservedUser.fullName || '',
      phone: unreservedUser.phone || '',
      userUuid: unreservedUser.uuid,
    };
  }

  const isPastSlot = moment().isAfter(end);

  return (
    <>
      <h2>{t('booking_form.reserve_title')}</h2>
      <h3>{bookingTypeName}</h3>
      {isPastSlot && (
        <p>
          <b>{t('booking_form.ended_slot')}</b>
        </p>
      )}
      {!!bookingTypeAdditionalInformation && <p>{bookingTypeAdditionalInformation}</p>}
      <p>
        <b>{t('booking_form.date')}:</b> {start.format('dddd Do MMMM YYYY')}
      </p>
      <p>
        <b>{t('booking_form.time')}:</b> {start.format('HH:mm')} - {end.format('HH:mm')}
      </p>
      <p>
        <b>{t('booking_form.seats')}:</b> {availableSeats} / {seats}
      </p>

      {availableSeats < 1 && <p>{t('booking_form.fully_booked')}</p>}
      {isReserved && (
        <p>
          <b>{t('booking_form.already_booked')}</b>
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
          enableReinitialize
        >
          {({ setFieldValue }) => (
            <Form>
              {user.role === UserRole.staff && (
                <>
                  <label htmlFor="booking-details-user-uuid">{t('booking_form.form.title')}</label>
                  <Field
                    type="text"
                    name="userUuid"
                    id="booking-details-user-uuid"
                    required
                    as="select"
                    // @ts-ignore
                    render={({ field }) => (
                      <Select
                        {...field}
                        isSearchable
                        value={
                          unreservedUserOptions
                            ? unreservedUserOptions.find((option) => option.value === field.value)
                            : ''
                        }
                        options={unreservedUserOptions}
                        onChange={(opt: { value: string; key: string }) => {
                          const selectedUser = unreservedUsers.find((u) => u.uuid === opt.value);
                          if (selectedUser) {
                            setFieldValue('email', selectedUser.email);
                            setFieldValue('fullName', selectedUser.fullName || '');
                            setFieldValue('phone', selectedUser.phone || '');
                          }
                          setFieldValue(field.name, opt.value);
                        }}
                        onBlur={field.onBlur}
                      />
                    )}
                  ></Field>
                </>
              )}
              <label htmlFor="booking-details-full-name">{t('booking_form.form.fullname')}</label>
              <Field type="text" name="fullName" id="booking-details-full-name" required />
              <label htmlFor="booking-details-email">{t('booking_form.form.email')}</label>
              <Field type="text" name="email" id="booking-details-email" required />
              <label htmlFor="booking-details-phone">{t('booking_form.form.phone')}</label>
              <Field type="text" name="phone" id="booking-details-phone" required />
              <label id="booking-details-preferred-working-location-label">
                {t('booking_form.form.work_location')}
              </label>
              <div role="group" aria-labelledby="booking-details-preferred-working-location-label">
                <label>
                  <Field type="radio" name="workingRemotely" value="false" />
                  {t('booking_form.form.office')}
                </label>
                <label>
                  <Field type="radio" name="workingRemotely" value="true" />
                  {t('booking_form.form.remote')}
                </label>
              </div>
              <label htmlFor="booking-details-booking-note">{t('booking_form.form.notes')}</label>
              <Field
                type="text"
                name="bookingNote"
                id="booking-details-booking-note"
                as="textarea"
              />
              <input
                className="button button-primary"
                type="submit"
                value={t('booking_form.form.book_slot')}
              />
            </Form>
          )}
        </Formik>
      )}

      {user?.role === UserRole.staff && slotBookings.length > 0 && (
        <>
          <h2>{t('booking_form.form.reserved_by')}:</h2>
          {slotBookings.map(({ uuid, user, fullName, email, phone }) => (
            <p key={uuid}>
              <b>{t('booking_form.form.user')}:</b> {user.email}
              <br />
              <b>{t('booking_form.form.booking_details')}</b>
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

      <button className="button width-100 margin-top-l" type="button" onClick={dismissModal}>
        {t('booking_form.form.close')}
      </button>
    </>
  );
};

function findPhoneNumberFromClosestBooking(bookingsByUser: ApiBooking[]): string | null {
  bookingsByUser.sort((a, b) => (new Date(a.start) < new Date(b.start) ? 1 : -1));
  const nextUpcoming = bookingsByUser.find((b) => new Date(b.start) > new Date());
  if (typeof nextUpcoming !== 'undefined') {
    return nextUpcoming.phone;
  } else if (bookingsByUser.length > 0) {
    return bookingsByUser[bookingsByUser.length - 1].phone;
  } else {
    return null;
  }
}
