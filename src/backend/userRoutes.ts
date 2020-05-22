import express from 'express';
import { getApiUsers, updateApiUserRole } from './controllers/userControllers';

import { UserRole } from '../common/constants-common';

const router = express.Router();

router.get('/', async (req, res) => {
  // Only allow admin to see users list
  // @ts-ignore
  if (req.user.role !== UserRole.staff) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }
  const users = await getApiUsers();
  res.status(200).json({ data: users });
});

router.put('/:uuid/role', async (req, res) => {
  // Only allow staff to edit user's role
  // @ts-ignore
  if (req.user.role !== UserRole.staff) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }

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
});

export default router;
