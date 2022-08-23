import React from 'react';
import { Router, Redirect, RouteComponentProps } from '@reach/router';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { Users } from './pages/Users/Users';
import { Profile } from './pages/Profile/Profile';
import { Letters } from './pages/Letters/Letters';
import { Reply } from './pages/Reply/Reply';
import { BookingTypes } from './pages/BookingTypes/BookingTypes';
import { Booking } from './pages/Booking/Booking';
import { MyBookings } from './pages/MyBookings/MyBookings';
import { AllBookings } from './pages/AllBookings/AllBookings';
import { ProfileSettings } from './pages/ProfileSettings/ProfileSettings';
import { Materials } from './pages/Materials/Materials';

export const AdminRouter: React.FunctionComponent<RouteComponentProps> = () => {
  const { token, user } = useAuth();

  return !token || !user || user.role !== UserRole.staff ? (
    <Redirect noThrow to="/" />
  ) : (
    <Router>
      <Users path="users" />
      <Profile path="users/:userUuid" />
      <Letters path="letters" />
      <Reply path="letters/:letterUuid" />
      <BookingTypes path="booking-types" />
      <Booking path="booking" />
      <MyBookings path="my-bookings" />
      <AllBookings path="all-bookings" />
      <ProfileSettings path="settings" />
      <Materials path="materials" />
    </Router>
  );
};
