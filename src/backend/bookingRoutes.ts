import express from 'express';

import { createBooking } from './bookingController';
import { UserRole, ApiBooking, ApiCreateBookingParams } from '../common/constants-common';
import { isAuthenticated } from './middlewares';

const router = express.Router();

router.post<
  Record<string, never>,
  { data: ApiBooking } | { error: string },
  ApiCreateBookingParams
>('/', isAuthenticated([UserRole.staff, UserRole.volunteer]), async (req, res) => {
  const user = req.user as Express.User;

  // TODO: add strict validation for each request body param
  if (!req.body) {
    res.status(400).json({ error: 'inavlid payload' });
    return;
  }

  // Only allow staff members to create bookings for any other users
  if (!!req.body.userUuid && user.uuid && user.role !== UserRole.staff) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  const { email, phone, fullName, bookingTypeUuid, start, end, userUuid } = req.body;

  const newBooking = await createBooking({
    email,
    phone,
    fullName,
    userUuid,
    bookingTypeUuid,
    start: new Date(start),
    end: new Date(end),
  });

  if (newBooking === null) {
    res.status(400).json({ error: 'unable to create new booking' });
    return;
  }

  res.status(201).json({ data: newBooking });
});

export default router;
