import express from 'express';

import { getAllLetters, assignLetter } from './controllers/letterControllers';
import { ApiLetterAdmin, UserRole } from '../common/constants-common';

const router = express.Router();

router.get('/', async (req, res) => {
  // Only allow staff to edit user's role
  // @ts-ignore
  if (req.user.role !== UserRole.staff) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }
  const letters = await getAllLetters();
  if (!letters) {
    res.status(200).json({ data: [] });
    return;
  }
  const result = letters
    .map(
      (letter): ApiLetterAdmin => {
        const { created, uuid, title, content, assignedResponderUuid, status } = letter;
        return { uuid, created, title, content, assignedResponderUuid, status };
      },
    )
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  res.status(200).json({ data: result });
});

router.post('/assign', async (req, res) => {
  // Only allow staff to edit user's role
  // @ts-ignore
  if (req.user.role !== UserRole.staff) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }
  const { letterUuid, assigneeUuid } = req.body;
  if (!letterUuid || !assigneeUuid) {
    res.status(400).json({ error: 'missing letterUuid or assigneeUuid in request body' });
    return;
  }

  const letter = await assignLetter({ letterUuid, assigneeUuid });
  if (!letter) {
    res.status(400).json({ error: 'failed to assign letter' });
    return;
  }
  res.status(201).json({ data: letter });
});

export default router;
