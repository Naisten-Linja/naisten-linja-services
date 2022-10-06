/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers } from '../test-utils';
import { User } from '../models/users';
import { Letter, updateLetterAssignee, getLetterByUuid } from '../models/letters';
import { letterModelToApiLetterWithReadStatus } from '../controllers/letterControllers';
import { getReply } from '../models/replies';
import { replyModelToApiReplyAdmin } from '../controllers/replyControllers';

describe('letterRoutes', () => {
  let app: express.Application;
  let volunteerUser: User;
  let staffUser: User;
  let unassignedUser: User;

  let letter1: Letter;
  let letter2: Letter;
  let letter3: Letter;

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  beforeEach(async () => {
    await TestApiHelpers.resetDb();
    [staffUser, volunteerUser, unassignedUser] = await TestApiHelpers.populateTestUsers();
    [letter1, letter2, letter3] = await TestApiHelpers.populateOnlineLetters();
  });

  afterEach(async () => {
    await TestApiHelpers.resetDb();
  });

  describe('GET /api/letters', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).get('/api/letters').set('Accept', 'application/json');

      expect(res.statusCode).toEqual(401);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not allow unassigned user to view any letters', async () => {
      const { token } = await TestApiHelpers.getToken(unassignedUser);
      const res = await request(app)
        .get('/api/letters')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not show any letters to volunteer users if they are not assigned to any', async () => {
      const { token } = await TestApiHelpers.getToken(volunteerUser);
      const res = await request(app)
        .get('/api/letters')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(0);
    });

    it('should allow volunteer to view letters they are assigned to', async () => {
      const updated = await updateLetterAssignee({
        letterUuid: letter2.uuid,
        assigneeUuid: volunteerUser.uuid,
      });
      expect(updated).not.toBeNull();
      if (!updated) {
        throw 'failed to assign letter to user';
      }

      const { token } = await TestApiHelpers.getToken(volunteerUser);
      const res = await request(app)
        .get('/api/letters')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([
        {
          ...letterModelToApiLetterWithReadStatus(letter2),
          assignedResponderEmail: volunteerUser.email,
          assignedResponderFullName: volunteerUser.fullName,
          assignedResponderUuid: volunteerUser.uuid,
        },
      ]);
    });

    it('should allow staff to view all letters', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      const res = await request(app)
        .get('/api/letters')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(3);
      expect(res.body.data).toIncludeAllMembers(
        [letter1, letter2, letter3].map(letterModelToApiLetterWithReadStatus),
      );
    });
  });

  describe('GET /api/letters/:uuid', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/api/letters/${letter3.uuid}`)
        .set('Accept', 'application/json');

      expect(res.statusCode).toEqual(401);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not allow unassigned user to view any letter', async () => {
      const { token } = await TestApiHelpers.getToken(unassignedUser);
      const res = await request(app)
        .get(`/api/letters/${letter3.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not allow volunteer to view letter they are not assigned to', async () => {
      const { token } = await TestApiHelpers.getToken(volunteerUser);
      const res = await request(app)
        .get(`/api/letters/${letter3.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should allow staff to view any letter', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      const res = await request(app)
        .get(`/api/letters/${letter3.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual(letter3);
    });

    it('should allow volunteer to view a letter they are assigned to', async () => {
      const updated = await updateLetterAssignee({
        letterUuid: letter3.uuid,
        assigneeUuid: volunteerUser.uuid,
      });
      expect(updated).not.toBeNull();
      if (!updated) {
        throw 'failed to assign letter to user';
      }
      const { token } = await TestApiHelpers.getToken(volunteerUser);
      const res = await request(app)
        .get(`/api/letters/${letter3.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual({
        ...letter3,
        assignedResponderEmail: volunteerUser.email,
        assignedResponderFullName: volunteerUser.fullName,
        assignedResponderUuid: volunteerUser.uuid,
      });
    });
  });

  describe('POST /api/letters/assign', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/letters/assign')
        .set('Accept', 'application/json')
        .send({ letterUuid: letter1.uuid, assigneeUuid: volunteerUser.uuid });

      expect(res.statusCode).toEqual(401);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not allow unassigned and volunteer users to assign letters to other users', async () => {
      const users = [volunteerUser, unassignedUser];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);
        const res = await request(app)
          .post('/api/letters/assign')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` })
          .send({ letterUuid: letter1.uuid, assigneeUuid: volunteerUser.uuid });

        expect(res.statusCode).toEqual(403);
        expect(res.body?.data).toBeUndefined();
        expect(res.body?.error).not.toBeEmpty();
      }
    });

    it('should allow staff user to assign letters to volunteers', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      const res = await request(app)
        .post('/api/letters/assign')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` })
        .send({ letterUuid: letter3.uuid, assigneeUuid: volunteerUser.uuid });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toEqual(
        letterModelToApiLetterWithReadStatus({
          ...letter3,
          assignedResponderUuid: volunteerUser.uuid,
        }),
      );

      const updatedLetter = await getLetterByUuid(letter3.uuid);
      expect(updatedLetter).not.toBeNull();
      if (!updatedLetter) {
        throw 'unable to get updated letter by uuid';
      }
      expect(updatedLetter.assignedResponderUuid).toEqual(volunteerUser.uuid);
    });

    it('should allow staff user to unassign an assigned letter', async () => {
      // When: letter was already assigned to a volunteer
      const updated = await updateLetterAssignee({
        letterUuid: letter3.uuid,
        assigneeUuid: volunteerUser.uuid,
      });
      expect(updated).not.toBeNull();
      if (!updated) {
        throw 'failed to assign letter to user';
      }

      // When: staff user set the same letter's assignee to null
      const { token } = await TestApiHelpers.getToken(staffUser);
      const res = await request(app)
        .post('/api/letters/assign')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` })
        .send({ letterUuid: letter3.uuid, assigneeUuid: null });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toEqual(letterModelToApiLetterWithReadStatus(letter3));

      // Then: the letter should no longer be assigned to the volunteer
      const updatedLetter = await getLetterByUuid(letter3.uuid);
      expect(updatedLetter).not.toBeNull();
      if (!updatedLetter) {
        throw 'unable to get updated letter by uuid';
      }
      expect(updatedLetter.assignedResponderUuid).toEqual(null);

      // And: the volunteer can no longer view the letter
      const volunteerToken = (await TestApiHelpers.getToken(volunteerUser)).token;
      const volunteerRes = await request(app)
        .get(`/api/letters/${letter3.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${volunteerToken}` });

      expect(volunteerRes.statusCode).toEqual(403);
      expect(volunteerRes.body.error).not.toBeEmpty();
      expect(volunteerRes.body.data).toBeUndefined();
    });
  });

  describe('POST /api/letters/:uuid/reply', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .post(`/api/letters/${letter1.uuid}/reply`)
        .set('Accept', 'application/json')
        .send({ content: 'reply content', status: 'in_review' });

      expect(res.statusCode).toEqual(401);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not allow unassigned and volunteer users to reply to letters', async () => {
      const users = [unassignedUser, volunteerUser];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);
        const res = await request(app)
          .post(`/api/letters/${letter1.uuid}/reply`)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` })
          .send({ content: 'reply content', status: 'in_review' });

        expect(res.statusCode).toEqual(403);
        expect(res.body?.data).toBeUndefined();
        expect(res.body?.error).not.toBeEmpty();
      }
    });

    it('should only allow volunteer to reply to letters they are assigned to', async () => {
      const updatedLetter = updateLetterAssignee({
        letterUuid: letter1.uuid,
        assigneeUuid: volunteerUser.uuid,
      });
      expect(updatedLetter).not.toBeNull();
      if (!updatedLetter) {
        throw 'unable to assign letter to volunteer user';
      }

      const { token } = await TestApiHelpers.getToken(volunteerUser);
      const res = await request(app)
        .post(`/api/letters/${letter1.uuid}/reply`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` })
        .send({ content: 'reply content', status: 'in_review' });

      expect(res.statusCode).toEqual(201);
      const reply = await getReply(letter1.uuid);
      if (!reply) {
        throw "unable to get letter's reply";
      }
      expect(res.body.data).toEqual(replyModelToApiReplyAdmin(reply));
    });
  });
});
