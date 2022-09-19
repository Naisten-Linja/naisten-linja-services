import React from 'react';
import { Routes, Route } from 'react-router-dom';

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
import { Redirect } from './Redirect';

export const AdminRouter: React.FunctionComponent = () => {
  const { token, user } = useAuth();

  return !token || !user || user.role !== UserRole.staff ? (
    <Redirect to="/" />
  ) : (
    <Routes>
      <Route path="users" element={<Users />} />
      <Route path="users/:userUuid" element={<Profile />} />
      <Route path="letters" element={<Letters />} />
      <Route path="letters/:letterUuid" element={<Reply />} />
      <Route path="booking-types" element={<BookingTypes />} />
      <Route path="booking" element={<Booking />} />
      <Route path="my-bookings" element={<MyBookings />} />
      <Route path="all-bookings" element={<AllBookings />} />
      <Route path="settings" element={<ProfileSettings />} />
      <Route path="materials" element={<Materials />} />
    </Routes>
  );
};
