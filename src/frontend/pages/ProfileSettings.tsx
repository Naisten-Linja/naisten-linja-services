import React, { useCallback, useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Formik, Field, Form } from 'formik';

import { ApiUserData } from '../../common/constants-common';
import { useRequest } from '../http';
import { useNotifications } from '../NotificationsContext';

export const ProfileSettings: React.FC<RouteComponentProps> = () => {
  const { getRequest, putRequest } = useRequest();
  const { addNotification } = useNotifications();
  const [userData, setUserData] = useState<ApiUserData | null>(null);

  const initialFormValues = {
    newBookingNotificationDaysThreshold:
      userData && userData.newBookingNotificationDaysThreshold
        ? userData.newBookingNotificationDaysThreshold
        : 0,
  };

  const fetchProfileInfo = useCallback(async () => {
    const result = await getRequest<{ data: ApiUserData }>('/api/profile', {
      useJwt: true,
    });
    if (result.data.data) {
      setUserData(result.data.data);
    } else {
      setUserData(null);
    }
  }, [setUserData, getRequest]);

  useEffect(() => {
    fetchProfileInfo();
    // Fetch profile info on first mount
    // eslint-disable-next-line
  }, []);
  return (
    <div className="width-100">
      <h1>Notification settings</h1>
      {userData && (
        <Formik
          initialValues={initialFormValues}
          onSubmit={async ({ newBookingNotificationDaysThreshold }) => {
            const sanitizedThreshold =
              newBookingNotificationDaysThreshold < 1 ? null : newBookingNotificationDaysThreshold;
            const result = await putRequest<{ data: ApiUserData }>(
              '/api/profile',
              {
                newBookingNotificationDaysThreshold: sanitizedThreshold,
              },
              { useJwt: true },
            );
            if (
              result?.data?.data &&
              result.data.data.newBookingNotificationDaysThreshold === sanitizedThreshold
            ) {
              addNotification({
                type: 'success',
                message: 'New booking notification setting updated',
              });
            } else {
              addNotification({
                type: 'error',
                message: 'Failed to update booking notification setting.',
              });
            }
          }}
        >
          <Form>
            <div className="field max-width-s">
              <label htmlFor="new-booking-days-threshold">
                Day threshold for receiving new booking notifications. For example, if this is set
                to 5, you will receive an email notification whenever a booking is made 5 or less
                days before the start of the slot. The aim is to keep you up to date with
                last-minute bookings. To disable notifications to your email, set this to 0.
              </label>
              <Field
                id="new-booking-days-threshold"
                type="number"
                name="newBookingNotificationDaysThreshold"
                className="max-width-xs"
                required
              />
            </div>
            <button type="submit" className="button button-info">
              Save
            </button>
          </Form>
        </Formik>
      )}
    </div>
  );
};
