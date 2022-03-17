import express from 'express';

import { getApiUsers, updateApiUserRole, updateUserSettings } from '../controllers/userControllers';
import { UserRole } from '../../common/constants-common';
import { ApiUserData } from '../../common/constants-common';
import { isAuthenticated } from '../middlewares';

const router = express.Router();

router.get<Record<string, never>, { data: Array<ApiUserData> }>(
  '/',
  isAuthenticated([UserRole.staff]),
  async (_, res) => {
    const users = await getApiUsers();
    res.status(200).json({ data: users });
  },
);

router.put<{ uuid: string }, { data: ApiUserData } | { error: string }, { role: UserRole }>(
  '/:uuid/role',
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    // Verify if role in request body is valid
    if (!req.body.role || Object.values(UserRole).indexOf(req.body.role) < 0) {
      res
        .status(400)
        .json({ error: `invalid role. allowed roles are ${Object.values(UserRole).join(', ')}` });
      return;
    }

    // Update the user's role with uuid specifed in route
    const updatedUser = await updateApiUserRole({ uuid: req.params.uuid, role: req.body.role });
    if (!updatedUser) {
      res.status(400).json({ error: `unable to update user` });
      return;
    }
    res.status(201).json({ data: updatedUser });
  },
);

router.put<
  Record<string, never>,
  { data: ApiUserData } | { error: string },
  { newBookingNotificationDaysThreshold: number | null }
>(
  '/profile/settings',
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
      res.status(400).json({ error: `unable to update user settings` });
      return;
    }
    res.status(201).json({ data: updatedUser });
  },
);

export default router;
