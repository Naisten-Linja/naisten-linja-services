import React, { useState } from 'react';

// Use translation
import { useTranslation } from 'react-i18next';
import { namespaces } from '../../i18n/i18n.constants';

import { UserRole } from '../../../common/constants-common';
import { useAuth } from '../../AuthContext';
import { ContentPage } from '../../ui-components/ContentPage/ContentPage';
import { EditContentPageForm } from '../../ui-components/ContentPage/EditContentPageForm';

export const Materials: React.FC = () => {
  const { t } = useTranslation(namespaces.pages.materials);

  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  if (!isEditing) {
    return (
      <>
        <ContentPage slug="/materials" />
        {user && user.role === UserRole.staff && (
          <button
            className="button margin-top-xs button-primary"
            onClick={() => setIsEditing(true)}
          >
            {t('edit_page')}
          </button>
        )}
      </>
    );
  }

  return (
    <EditContentPageForm
      slug="/materials"
      afterSubmit={() => setIsEditing(false)}
      afterCancel={() => setIsEditing(false)}
    />
  );
};
