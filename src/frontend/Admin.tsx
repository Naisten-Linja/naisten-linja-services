import React from 'react';
import { Router, Redirect, RouteComponentProps } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { Users } from './Users';
import { Letters } from './Letters';
import { Reply } from './Reply';
import { BookingTypes } from './pages/BookingTypes';
import { Booking } from './pages/Booking';
import { MyBookings } from './pages/MyBookings';
import { AllBookings } from './pages/AllBookings';
import { ProfileSettings } from './pages/ProfileSettings';

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
      <Booking path="booking" />
      <MyBookings path="my-bookings" />
      <AllBookings path="all-bookings" />
      <ProfileSettings path="settings" />
    </Router>
  );
};
