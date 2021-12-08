import express from 'express';

import { createBooking, getAllBookings } from './bookingController';
import {
  UserRole,
  ApiBooking,
  ApiCreateBookingParams,
  ApiBookedSlot,
} from '../common/constants-common';
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
  if (req.body.userUuid !== user.uuid && user.role !== UserRole.staff) {
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

router.get<
  Record<string, never>,
  { data: Array<ApiBookedSlot> } | { error: string },
  Record<string, never>,
  { startDate: string; endDate: string }
>('/', isAuthenticated([UserRole.staff, UserRole.volunteer]), async (req, res) => {
  const allBookings = await getAllBookings();
  if (allBookings === null) {
    res.status(400).json({ error: 'unable to get booking data' });
    return;
  }

  if (!req.query?.startDate || !req.query?.endDate) {
    res.status(400).json({ error: 'Missing startDate or endDate in request body' });
    return;
  }

  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);

  const bookedSlotsCount = allBookings
    .filter(({ start, end }) => startDate <= new Date(start) && endDate >= new Date(end))
    .reduce((result, { start, end, bookingType }) => {
      const existingSlotIndex = result.findIndex(
        (r) => r.start === start && r.end === end && r.bookingTypeUuid === bookingType.uuid,
      );
      if (existingSlotIndex < 0) {
        return [...result, { start, end, bookingTypeUuid: bookingType.uuid, count: 1 }];
      } else {
        result[existingSlotIndex] = {
          ...result[existingSlotIndex],
          count: result[existingSlotIndex].count + 1,
        };
        return result;
      }
    }, [] as Array<ApiBookedSlot>);
  res.status(200).json({ data: bookedSlotsCount });
});

export default router;
