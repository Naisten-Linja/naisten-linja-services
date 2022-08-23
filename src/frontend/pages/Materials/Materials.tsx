import React, { useState } from 'react';
import { RouteComponentProps } from '@reach/router';

import { UserRole } from '../../../common/constants-common';
import { useAuth } from '../../AuthContext';
import { ContentPage } from '../../ui-components/ContentPage/ContentPage';
import { EditContentPageForm } from '../../ui-components/ContentPage/EditContentPageForm';

export const Materials: React.FunctionComponent<RouteComponentProps> = () => {
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
            Edit page
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
