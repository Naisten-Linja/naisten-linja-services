import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { UserRole } from '../common/constants-common';
import { useAuth } from './AuthContext';
import { Letters } from './pages/Letters/Letters';
import { Reply } from './pages/Reply/Reply';
import { Booking } from './pages/Booking/Booking';
import { MyBookings } from './pages/MyBookings/MyBookings';
import { Materials } from './pages/Materials/Materials';
import { Redirect } from './Redirect';

export const VolunteerRouter: React.FC = () => {
  const { token, user } = useAuth();

  return !token || !user || user.role !== UserRole.volunteer ? (
    <Redirect to="/" />
  ) : (
    <Routes>
      <Route path="letters" element={<Letters />} />
      <Route path="letters/:letterUuid" element={<Reply />} />
      <Route path="booking" element={<Booking />} />
      <Route path="my-bookings" element={<MyBookings />} />
      <Route path="materials" element={<Materials />} />
    </Routes>
  );
};
