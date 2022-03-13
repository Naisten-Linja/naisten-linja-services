import express from 'express';

import {
  createBooking,
  getAllBookings,
  getUserBookings,
  deleteBooking,
  updateBooking,
} from '../controllers/bookingControllers';
import {
  UserRole,
  ApiBooking,
  ApiCreateBookingParams,
  ApiUpdateBookingParams,
  ApiBookedSlot,
} from '../../common/constants-common';
import {
  sendBookingConfirmationEmail,
  sendNewBookingNotificationToStaffs,
} from '../controllers/emailControllers';

import { isAuthenticated } from '../middlewares';

const router = express.Router();

router.post<
  Record<string, never>,
  { data: ApiBooking } | { error: string },
  ApiCreateBookingParams
>('/', isAuthenticated([UserRole.staff, UserRole.volunteer]), async (req, res) => {
  const user = req.user as Express.User;

  // TODO: add strict validation for each request body param
  if (!req.body) {
    res.status(400).json({ error: 'invalid payload' });
    return;
  }

  // Only allow staff members to create bookings for any other users
  if (req.body.userUuid !== user.uuid && user.role !== UserRole.staff) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const {
    email,
    phone,
    fullName,
    bookingTypeUuid,
    bookingNote,
    start,
    end,
    userUuid,
    workingRemotely,
  } = req.body;

  const newBooking = await createBooking({
    email,
    phone,
    fullName,
    userUuid,
    bookingTypeUuid,
    bookingNote,
    workingRemotely,
    start: new Date(start),
    end: new Date(end),
  });

  if (newBooking === null) {
    res.status(400).json({ error: 'unable to create new booking' });
    return;
  }

  // Not using await here in order to send email asyncronously without blocking the response
  sendBookingConfirmationEmail(newBooking).then((isSent) => {
    if (!isSent) {
      console.log(`Unable to send confirmation email for booking ${newBooking.uuid}`);
    }
  });

  // Initializing a new Date object, so setHours() does not mutate newBooking.start
  const bookingDay = new Date(newBooking.start);
  // Always use the beginning of the day for comparison.
  bookingDay.setHours(0, 0, 0, 0);
  const bookingDaysInAdvance = (bookingDay.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
  // Send notification to staff if a booking is made 14 days or less in advance
  if (bookingDaysInAdvance <= 14) {
    sendNewBookingNotificationToStaffs(newBooking).then((isSent) => {
      if (!isSent) {
        console.log(`Unable to send new booking notification for booking ${newBooking.uuid}`);
      }
    });
  }

  if (newBooking.start) {
    res.status(201).json({ data: newBooking });
  }
});

router.get<Record<string, never>, { data: Array<ApiBooking> } | { error: string }>(
  '/',
  isAuthenticated([UserRole.staff, UserRole.volunteer]),
  async (req, res) => {
    const user = req.user as Express.User;
    const bookings = (await getUserBookings(user.uuid)) || [];

    res.status(200).json({ data: bookings });
  },
);

router.get<Record<string, never>, { data: Array<ApiBooking> } | { error: string }>(
  '/all',
  // Only allow staff to view all detailed booking information
  isAuthenticated([UserRole.staff]),
  async (_, res) => {
    const bookings = (await getAllBookings()) || [];
    res.status(200).json({ data: bookings });
  },
);

router.get<
  Record<string, never>,
  { data: Array<ApiBookedSlot> } | { error: string },
  Record<string, never>,
  { startDate: string; endDate: string }
>('/calendar', isAuthenticated([UserRole.staff, UserRole.volunteer]), async (req, res) => {
  if (!req.query?.startDate || !req.query?.endDate) {
    res.status(400).json({ error: 'Missing startDate or endDate in request body' });
    return;
  }

  const allBookings = (await getAllBookings()) || [];
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

router.delete<{ bookingUuid: string }, { data: { success: boolean } }>(
  '/booking/:bookingUuid',
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { bookingUuid } = req.params;
    const success = await deleteBooking(bookingUuid);
    res.status(202).json({ data: { success } });
  },
);

router.put<
  { bookingUuid: string },
  { data: ApiBooking } | { error: string },
  ApiUpdateBookingParams
>(
  '/booking/:bookingUuid',
  // Only allow staff to modify existing booking notes
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { bookingUuid } = req.params;
    if (!req.body) {
      res.status(400).json({ error: 'missing required data in request body' });
      return;
    }
    const { phone, fullName, email, bookingNote } = req.body;
    const updatedBooking = await updateBooking({
      uuid: bookingUuid,
      phone,
      fullName,
      email,
      bookingNote,
    });

    if (updatedBooking === null) {
      res.status(400).json({ error: 'failed to update booking' });
      return;
    }

    res.status(200).json({ data: updatedBooking });
  },
);

export default router;
