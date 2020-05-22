import React from 'react';
import { Router, Redirect, RouteComponentProps } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { Users } from './Users';
import { Letters } from './Letters';

export const Admin: React.FunctionComponent<RouteComponentProps> = () => {
  const { token, user } = useAuth();

  return !token || !user || user.role !== UserRole.staff ? (
    <Redirect noThrow to="/" />
  ) : (
    <Router>
      <Users path="users" />
      <Letters path="letters" />
    </Router>
  );
};
