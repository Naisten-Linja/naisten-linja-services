import React, { useState } from 'react';
import { RouteComponentProps } from '@reach/router';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../i18n/i18n.constants';

import { UserRole } from '../../common/constants-common';
import { useAuth } from '../AuthContext';
import { ContentPage } from '../ui-components/ContentPage/ContentPage';
import { EditContentPageForm } from '../ui-components/ContentPage/EditContentPageForm';

export const FrontPage: React.FunctionComponent<RouteComponentProps> = () => {
  const { t } = useTranslation(namespaces.pages.front);

  console.log(t('login'));
  const [isEditing, setIsEditing] = useState(false);
  const { user, login } = useAuth();

  if (!user) {
    return (
      <div>
        <p>{t('p-1')}</p>
        <button onClick={login} className="button button-primary">
          {t('login')}
        </button>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <>
        <ContentPage slug="/" />
        {user.role === UserRole.staff && (
          <button
            className="button margin-top-xs button-primary"
            onClick={() => setIsEditing(true)}
          >
            {t('edit-page')}
          </button>
        )}
      </>
    );
  }

  return (
    <EditContentPageForm
      slug="/"
      afterSubmit={() => setIsEditing(false)}
      afterCancel={() => setIsEditing(false)}
    />
  );
};
