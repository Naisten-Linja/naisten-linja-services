import express from 'express';

import { getAllLetters, assignLetter, getLetter } from './letterControllers';
import {
  replyToLetter,
  isUserAssignedToLetter,
  getLettersReplies,
  updateLettersReply,
} from './replyController';
import { ApiLetterAdmin, UserRole, ResponderType } from '../common/constants-common';

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

router.get('/:uuid', async (req, res) => {
  // Only allow staff to edit user's role
  // @ts-ignore
  if (req.user.role !== UserRole.staff) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }
  const { uuid } = req.params;
  if (!uuid) {
    res.status(400).json({ error: 'missing uuid' });
  }
  const letter = await getLetter(uuid);
  if (!letter) {
    res.status(404).json({ error: 'not found' });
    return;
  }
  res.status(200).json({ data: letter });
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

router.post('/:uuid/replies', async (req, res) => {
  // @ts-ignore
  const user = req.user;
  const isVolunteer = user.role === UserRole.volunteer;
  const isStaff = user.role === UserRole.staff;
  const isAssigned = isUserAssignedToLetter(req.params.uuid, user.uuid);
  if ((isVolunteer && !isAssigned) || (!isVolunteer && !isStaff)) {
    res.status(401).json({ error: `User ${user.email} can't response to this letter` });
    return;
  }
  const { letterUuid, content, status } = req.body;
  if (!letterUuid || !content || !status) {
    res.status(400).json({ error: 'Missing letterUuid, content or status in request' });
    return;
  }
  const reply = await replyToLetter({
    letterUuid,
    content,
    status,
    internalAuthorUuid: user.uuid,
    authorType: ResponderType.internal,
  });
  if (!reply) {
    res.status(400).json({ error: 'Unable to response to letter' });
    return;
  }
  res.status(201).json({ data: reply });
});

router.get('/:uuid/replies', async (req, res) => {
  // @ts-ignore
  const user = req.user;
  const isVolunteer = user.role === UserRole.volunteer;
  const isStaff = user.role === UserRole.staff;
  const isAssigned = isUserAssignedToLetter(req.params.uuid, user.uuid);
  if ((isVolunteer && !isAssigned) || (!isVolunteer && !isStaff)) {
    res.status(401).json({ error: `User ${user.email} don't have acces to this letter's reply` });
    return;
  }
  const replies = await getLettersReplies(req.params.uuid);
  res.status(200).json({ data: replies });
});

router.post('/:letterUuid/replies/:replyUuid', async (req, res) => {
  const { letterUuid, replyUuid } = req.params;
  // @ts-ignore
  const user = req.user;
  const isVolunteer = user.role === UserRole.volunteer;
  const isStaff = user.role === UserRole.staff;
  const isAssigned = isUserAssignedToLetter(letterUuid, user.uuid);
  if ((isVolunteer && !isAssigned) || (!isVolunteer && !isStaff)) {
    res.status(401).json({ error: `User ${user.email} don't have acces to this letter's reply` });
    return;
  }
  // @ts-ignore
  const { content, status } = req.body;
  if (!content || !status) {
    res.status(400).json({ error: 'Missing content or status in request' });
    return;
  }
  const reply = await updateLettersReply(replyUuid, content, status);
  if (!reply) {
    res.status(400).json({ error: 'Unable to update reply' });
    return;
  }
  res.status(200).json({ data: reply });
});

export default router;
