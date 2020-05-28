import React from 'react';
import { Router, Redirect, RouteComponentProps } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { Letters } from './Letters';
import { Reply } from './Reply';

export const Volunteer: React.FunctionComponent<RouteComponentProps> = () => {
  const { token, user } = useAuth();

  return !token || !user || user.role !== UserRole.volunteer ? (
    <Redirect noThrow to="/" />
  ) : (
    <Router>
      <Letters path="letters" />
      <Reply path="letters/:letterUuid" />
    </Router>
  );
};
