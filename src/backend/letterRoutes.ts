import express from 'express';

import { getAllLetters, getAllAssignedLetters, assignLetter, getLetter } from './letterControllers';
import {
  replyToLetter,
  isUserAssignedToLetter,
  getLettersReply,
  updateLettersReply,
} from './replyController';
import { ApiLetterAdmin, UserRole, ResponderType, ReplyStatus } from '../common/constants-common';

const router = express.Router();

router.get('/', async (req, res) => {
  // @ts-ignore
  const { user } = req;
  const isStaff = user.role === UserRole.staff;
  const isVolunteer = user.role === UserRole.volunteer;

  // Only allow staff to edit user's role
  if (!isStaff && !isVolunteer) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }

  const letters = isStaff ? await getAllLetters() : await getAllAssignedLetters(user.uuid);
  if (!letters) {
    res.status(200).json({ data: [] });
    return;
  }
  const result = letters
    .map(
      (letter): ApiLetterAdmin => {
        const {
          created,
          uuid,
          title,
          content,
          assignedResponderUuid,
          assignedResponderEmail,
          assignedResponderFullName,
          status,
          replyStatus,
        } = letter;
        return {
          uuid,
          created,
          title,
          content,
          assignedResponderUuid,
          assignedResponderEmail,
          assignedResponderFullName,
          status,
          replyStatus,
        };
      },
    )
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  res.status(200).json({ data: result });
});

router.get('/:uuid', async (req, res) => {
  // Only allow staff to edit user's role
  // @ts-ignore
  const { user } = req;
  const isStaff = user.role === UserRole.staff;
  const isVolunteer = user.role === UserRole.volunteer;
  if (!isVolunteer && !isStaff) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }
  const { uuid } = req.params;
  const letter = await getLetter(uuid);
  if (!letter) {
    res.status(404).json({ error: 'not found' });
    return;
  }

  // Only allow volunteers to access letters assigned to them
  if (isVolunteer && letter.assignedResponderUuid !== user.uuid) {
    res.status(403).json({ error: 'unauthorized' });
    return;
  }

  res.status(200).json({ data: letter });
});

router.post('/assign', async (req, res) => {
  // @ts-ignore
  const { user } = req;

  // Only allow staff to assign letters
  if (user.role !== UserRole.staff) {
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

router.post('/:uuid/reply', async (req, res) => {
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

router.get('/:uuid/reply', async (req, res) => {
  // @ts-ignore
  const user = req.user;
  const isVolunteer = user.role === UserRole.volunteer;
  const isStaff = user.role === UserRole.staff;
  const isAssigned = isUserAssignedToLetter(req.params.uuid, user.uuid);
  if ((isVolunteer && !isAssigned) || (!isVolunteer && !isStaff)) {
    res.status(401).json({ error: `User ${user.email} don't have acces to this letter's reply` });
    return;
  }
  const reply = await getLettersReply(req.params.uuid);
  res.status(200).json({ data: reply });
});

router.post('/:letterUuid/reply/:replyUuid', async (req, res) => {
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
  if (status === ReplyStatus.published && user.role !== 'staff') {
    res.status(401).json({ error: 'Non staff users are not allowed to publish a response' });
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
