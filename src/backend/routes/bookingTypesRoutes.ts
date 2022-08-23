import express from 'express';

import {
  addBookingType,
  getBookingTypes,
  updateBookingType,
  deleteBookingType,
} from '../controllers/bookingTypeControllers';
import {
  UserRole,
  BookingTypeDailyRules,
  ApiBookingType,
  BookingTypeDateRange,
} from '../../common/constants-common';
import { isAuthenticated } from '../middlewares';

const router = express.Router();

router.get<
  Record<string, never>,
  { data: Array<ApiBookingType> } | { error: string },
  Record<string, never>
>(
  '/',
  // Only allow staff and volunteer members to fetch booking type list
  isAuthenticated([UserRole.staff, UserRole.volunteer]),
  async (_, res) => {
    const allBookingTypes = await getBookingTypes();
    if (allBookingTypes === null) {
      res.status(400).json({ error: 'unable to get all booking types' });
      return;
    }
    res.status(200).json({ data: allBookingTypes });
  },
);

router.post<
  Record<string, never>,
  { data: ApiBookingType } | { error: string },
  {
    name: string;
    rules: BookingTypeDailyRules;
    exceptions: Array<string>;
    dateRanges: Array<BookingTypeDateRange>;
    additionalInformation: string;
  }
>(
  '/',
  // Only allow staff members to create new booking types
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { name, rules, exceptions, dateRanges, additionalInformation } = req.body;
    const bookingType = await addBookingType({
      name,
      rules,
      exceptions,
      dateRanges,
      additionalInformation,
    });
    if (!bookingType) {
      res.status(400).json({ error: 'unable to create new booking rule' });
      return;
    }
    res.status(201).json({ data: bookingType });
  },
);

router.put<
  { uuid: string },
  { data: ApiBookingType } | { error: string },
  {
    name: string;
    rules: BookingTypeDailyRules;
    exceptions: Array<string>;
    dateRanges: Array<BookingTypeDateRange>;
    additionalInformation: string;
  }
>(
  '/:uuid',
  // Only allow staff members to modify booking types
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { name, rules, exceptions, dateRanges, additionalInformation } = req.body;
    const { uuid } = req.params;
    const allBookingTypes = await getBookingTypes();
    if (allBookingTypes === null || !allBookingTypes.map(({ uuid }) => uuid).includes(uuid)) {
      res.status(404).json({ error: 'booking type not found' });
      return;
    }
    const bookingType = await updateBookingType({
      uuid,
      name,
      rules,
      exceptions,
      dateRanges,
      additionalInformation,
    });
    if (!bookingType) {
      res.status(400).json({ error: 'unable to update booking type' });
      return;
    }
    res.status(200).json({ data: bookingType });
  },
);

router.delete<{ uuid: string }>(
  '/:uuid',
  // Only allow staff members to modify booking types
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { uuid } = req.params;
    const allBookingTypes = await getBookingTypes();
    if (allBookingTypes === null || !allBookingTypes.map(({ uuid }) => uuid).includes(uuid)) {
      res.status(404).json({ error: 'booking type not found' });
      return;
    }
    await deleteBookingType;
    res.status(204).json({ message: 'success' });
  },
);

export default router;
