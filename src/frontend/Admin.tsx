import React from 'react';
import { Router, Redirect, RouteComponentProps } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { Users } from './Users';
import { Letters } from './Letters';
import { Reply } from './Reply';
import { BookingTypes } from './pages/BookingTypes';

export const Admin: React.FunctionComponent<RouteComponentProps> = () => {
  const { token, user } = useAuth();

  return !token || !user || user.role !== UserRole.staff ? (
    <Redirect noThrow to="/" />
  ) : (
    <Router>
      <Users path="users" />
      <Letters path="letters" />
      <Reply path="letters/:letterUuid" />
      <BookingTypes path="booking-types" />
    </Router>
  );
};
