/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers } from '../test-utils';
import { User } from '../models/users';
import { Letter, updateLetterAssignee } from '../models/letters';
import { letterModelToApiLetterWithReadStatus } from '../controllers/letterControllers';

describe('letterRoutes', () => {
  let app: express.Application;
  let volunteerUser: User;
  let staffUser: User;
  let unassignedUser: User;

  let l1: Letter;
  let l2: Letter;
  let l3: Letter;

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  beforeEach(async () => {
    await TestApiHelpers.resetDb();
    [staffUser, volunteerUser, unassignedUser] = await TestApiHelpers.populateTestUsers();
    [l1, l2, l3] = await TestApiHelpers.populateOnlineLetters();
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
        letterUuid: l2.uuid,
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
          ...letterModelToApiLetterWithReadStatus(l2),
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
        [l1, l2, l3].map(letterModelToApiLetterWithReadStatus),
      );
    });
  });
});
