import React from 'react';
import { Router, Redirect, RouteComponentProps } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { Letters } from './pages/Letters/Letters';
import { Reply } from './pages/Reply/Reply';
import { Booking } from './pages/Booking/Booking';
import { MyBookings } from './pages/MyBookings/MyBookings';
import { Materials } from './pages/Materials/Materials';

export const VolunteerRouter: React.FunctionComponent<RouteComponentProps> = () => {
  const { token, user } = useAuth();

  return !token || !user || user.role !== UserRole.volunteer ? (
    <Redirect noThrow to="/" />
  ) : (
    <Router>
      <Letters path="letters" />
      <Reply path="letters/:letterUuid" />
      <Booking path="booking" />
      <MyBookings path="my-bookings" />
      <Materials path="materials" />
    </Router>
  );
};
