import express from 'express';

import { getApiUsers, updateApiUserNote, updateApiUserRole } from '../controllers/userControllers';
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

router.put<{ uuid: string }, { data: ApiUserData } | { error: string }, { userNote: string }>(
  '/:uuid/note',
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    if (!req.body) {
      res.status(400).json({ error: 'missing required data in request body' });
      return;
    }

    const { userNote } = req.body;

    // Update the user's role with uuid specifed in route
    const updatedUser = await updateApiUserNote({ uuid: req.params.uuid, userNote });
    if (!updatedUser) {
      res.status(400).json({ error: `unable to update user` });
      return;
    }
    res.status(201).json({ data: updatedUser });
  },
);

export default router;
