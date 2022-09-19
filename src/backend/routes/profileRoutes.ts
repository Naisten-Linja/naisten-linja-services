import express from 'express';

import { updateUserSettings, getUserData } from '../controllers/userControllers';
import { UserRole } from '../../common/constants-common';
import { ApiUserData } from '../../common/constants-common';
import { isAuthenticated } from '../middlewares';

const router = express.Router();

router.put<
  Record<string, never>,
  { data: ApiUserData } | { error: string },
  { newBookingNotificationDaysThreshold: number | null }
>(
  '/',
  // Only allow staff user to edit their own setting for now
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const user = req.user;
    const { newBookingNotificationDaysThreshold = null } = req.body ?? {};
    const updatedUser = await updateUserSettings({
      // The isAuthenticated middleware already ensures user is available here
      // eslint-disable-next-line
      uuid: user!.uuid,
      newBookingNotificationDaysThreshold,
    });
    if (!updatedUser) {
      res.status(400).json({ error: `unable to update user profile` });
      return;
    }
    res.status(201).json({ data: updatedUser });
  },
);

router.get<Record<string, never>, { data: ApiUserData | null } | { error: string }>(
  '/',
  // Only allow staff user to view their own setting for now
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    // The isAuthenticated middleware already ensures user is available here
    // eslint-disable-next-line
    const userUuid = req.user!.uuid;
    const userData = await getUserData(userUuid);
    if (!userData) {
      res.status(404).json({ error: `unable to get user profile` });
      return;
    }
    res.status(200).json({ data: userData });
  },
);

router.get<Record<string, never>, { data: ApiUserData | null } | { error: string }>(
  '/:userUuid',
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { userUuid } = req.params;
    const userData = await getUserData(userUuid);
    if (!userData) {
      res.status(404).json({ error: `unable to get user profile` });
      return;
    }
    res.status(200).json({ data: userData });
  },
);

export default router;
