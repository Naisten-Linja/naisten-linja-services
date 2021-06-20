import express from 'express';

import { addBookingType, getBookingTypes } from './bookingTypesController';
import { UserRole } from '../common/constants-common';

const router = express.Router();

router.post('/', async (req, res) => {
  const { user } = req;
  if (!user || user.role !== UserRole.staff) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const { name, rules, exceptions } = req.body;
  const bookingType = await addBookingType({ name, rules, exceptions });
  if (!bookingType) {
    res.status(400).json({ error: 'unable to create new booking rule' });
    return;
  }
  res.status(201).json({ data: bookingType });
});

router.get('/', async (req, res) => {
  // Only allow admin to see users list
  // @ts-ignore
  if (req.user.role !== UserRole.staff) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }
  const allBookingTypes = await getBookingTypes();
  if (allBookingTypes === null) {
    res.status(400).json({ error: 'unable to get all booking types' });
    return;
  }
  res.status(200).json({ data: allBookingTypes });
});

export default router;
