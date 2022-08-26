import React, { useCallback, useState, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import { Formik, Field, Form } from 'formik';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import { ApiUserData } from '../../../common/constants-common';
import { useRequest } from '../../shared/http';
import { useNotifications } from '../../NotificationsContext';

export const ProfileSettings: React.FC<RouteComponentProps> = () => {
  const { t } = useTranslation(namespaces.pages.settings);

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
      <h1>{t('title')}</h1>
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
                message: t('fetch_profile_info_success'),
              });
            } else {
              addNotification({
                type: 'error',
                message: t('fetch_profile_info_error'),
              });
            }
          }}
        >
          <Form>
            <div className="field max-width-s">
              <label htmlFor="new-booking-days-threshold">
                {t('text')}
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
              {t('button.save')}
            </button>
          </Form>
        </Formik>
      )}
    </div>
  );
};
