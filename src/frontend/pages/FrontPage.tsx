import React, { useState } from 'react';
import { RouteComponentProps } from '@reach/router';

import { UserRole } from '../../common/constants-common';
import { useAuth } from '../AuthContext';
import { ContentPage } from '../ui-components/ContentPage/ContentPage';
import { EditContentPageForm } from '../ui-components/ContentPage/EditContentPageForm';

export const FrontPage: React.FunctionComponent<RouteComponentProps> = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, login } = useAuth();

  if (!user) {
    return (
      <div>
        <p>Please login first to start using the service.</p>
        <button onClick={login} className="button button-primary">
          Login
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
            Edit page
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
