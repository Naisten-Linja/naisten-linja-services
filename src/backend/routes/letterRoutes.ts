import express from 'express';

import {
  getAllLetters,
  getAllAssignedLetters,
  assignLetter,
  getLetter,
} from '../controllers/letterControllers';
import {
  replyToLetter,
  isUserAssignedToLetter,
  getLettersReply,
  updateLettersReply,
} from '../controllers/replyControllers';
import {
  UserRole,
  ResponderType,
  ReplyStatus,
  ApiLetterWithReadStatus,
} from '../../common/constants-common';
import { isAuthenticated } from '../middlewares';

const router = express.Router();

router.get(
  '/',
  // Only allow volunteer and staff access
  isAuthenticated([UserRole.staff, UserRole.volunteer]),
  async (req, res) => {
    const user = req.user as Express.User<UserRole.staff | UserRole.volunteer>;

    const isStaff = user.role === UserRole.staff;
    const isVolunteer = user.role === UserRole.volunteer;

    const letters = isStaff
      ? await getAllLetters()
      : isVolunteer
      ? await getAllAssignedLetters(user.uuid)
      : null;

    if (!letters) {
      res.status(200).json({ data: [] });
      return;
    }

    const result = letters
      .map((letter): ApiLetterWithReadStatus => {
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
          replyReadReceipt,
          replyReadTimestamp,
          replyStatusTimestamp,
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
          replyReadReceipt,
          replyReadTimestamp,
          replyStatusTimestamp,
        };
      })
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    res.status(200).json({ data: result });
  },
);

router.get(
  '/:uuid',
  // Only allow volunteer and staff access
  isAuthenticated([UserRole.staff, UserRole.volunteer]),
  async (req, res) => {
    const user = req.user as Express.User<UserRole.staff | UserRole.volunteer>;

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
  },
);

router.post(
  '/assign',
  // Only allow staff access
  isAuthenticated([UserRole.staff]),
  async (req, res) => {
    const { letterUuid, assigneeUuid } = req.body;
    if (!letterUuid) {
      res.status(400).json({ error: 'missing letterUuid in request body' });
      return;
    }

    const letter = await assignLetter({ letterUuid, assigneeUuid });
    if (!letter) {
      res.status(400).json({ error: 'failed to assign letter' });
      return;
    }
    res.status(201).json({ data: letter });
  },
);

router.post(
  '/:uuid/reply',
  // Only allow staff and volunteer access
  isAuthenticated([UserRole.staff, UserRole.volunteer]),
  async (req, res) => {
    const user = req.user as Express.User<UserRole.volunteer | UserRole.staff>;
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
  },
);

router.get(
  '/:uuid/reply',
  // Only allow staff and volunteer access
  isAuthenticated([UserRole.staff, UserRole.volunteer]),
  async (req, res) => {
    const user = req.user as Express.User<UserRole.volunteer | UserRole.staff>;
    const isVolunteer = user.role === UserRole.volunteer;
    const isStaff = user.role === UserRole.staff;
    const isAssigned = isUserAssignedToLetter(req.params.uuid, user.uuid);
    if ((isVolunteer && !isAssigned) || (!isVolunteer && !isStaff)) {
      res.status(401).json({ error: `User ${user.email} don't have acces to this letter's reply` });
      return;
    }
    const reply = await getLettersReply(req.params.uuid);
    res.status(200).json({ data: reply });
  },
);

router.post(
  '/:letterUuid/reply/:replyUuid',
  // Only allow staff and volunteer access
  isAuthenticated([UserRole.staff, UserRole.volunteer]),
  async (req, res) => {
    const user = req.user as Express.User<UserRole.volunteer | UserRole.staff>;
    const { letterUuid, replyUuid } = req.params;
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
  },
);

export default router;
