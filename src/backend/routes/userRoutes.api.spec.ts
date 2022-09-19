/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers } from '../test-utils';
import { ApiUserData, UserRole } from '../../common/constants-common';
import { User, getUserByUuid } from '../models/users';
import { modelUserToApiUserData } from '../controllers/userControllers';

describe('userRoutes', () => {
  let app: express.Application;
  let volunteer: User;
  let staff: User;
  // TODO: Add tests for unassigned user

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
    [staff, volunteer] = await TestApiHelpers.populateTestUsers();
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  describe('GET /api/users', () => {
    it('should not allow public access by default', async () => {
      const res = await request(app).get('/api/users/').set('Accept', 'application/json');
      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteers to access user list', async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .get('/api/users/')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(403);
    });

    it('should allow staffs to access user list', async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const res = await request(app)
        .get('/api/users/')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

      const users = (res.body?.data || []) as Array<ApiUserData>;
      expect(res.statusCode).toEqual(200);
      expect(users.length).toEqual(3);
      expect(users).toIncludeAllPartialMembers([staff, volunteer].map(modelUserToApiUserData));
    });
  });

  describe('PUT /api/users/:uuid/role', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .put(`/api/users/${volunteer.uuid}/role`)
        .set('Accept', 'application/json')
        .set({ role: UserRole.staff });

      expect(res.statusCode).toEqual(401);
    });

    it("should not allow volunteer to modify other's roles", async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .put(`/api/users/${staff.uuid}/role`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .set({ role: UserRole.staff });

      expect(res.statusCode).toEqual(403);
    });

    it('should not allow volunteer to modify their own role', async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .put(`/api/users/${volunteer.uuid}/role`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .set({ role: UserRole.staff });

      expect(res.statusCode).toEqual(403);
    });

    it("should not allow staff to modify other user's roles to any other than the allowed values", async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const res = await request(app)
        .put(`/api/users/${volunteer.uuid}/role`)
        .send({ role: 'randomrole' })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(400);
    });

    it("should allow staff to modify other user's roles", async () => {
      const { token } = await TestApiHelpers.getToken(staff);

      const newVolunteer = await TestApiHelpers.createTestUser(
        {
          discourseUserId: 3,
          email: 'testVolunteerUser@naistenlinja.fi',
        },
        UserRole.volunteer,
      );

      for (const newRole in UserRole) {
        // Change user role to staff
        const res = await request(app)
          .put(`/api/users/${newVolunteer.uuid}/role`)
          .send({ role: newRole })
          .set('Accept', 'application/json')
          .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toEqual(201);

        const updatedUser = await getUserByUuid(newVolunteer.uuid);
        expect(updatedUser).not.toBe(null);
        expect(updatedUser?.role).toEqual(newRole);
      }
    });
  });

  describe('PUT /api/users/:uuid/note', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .put(`/api/users/${volunteer.uuid}/note`)
        .send({ userNote: 'test note' })
        .set('Accept', 'application/json');

      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteer to modify their own user note', async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .put(`/api/users/${volunteer.uuid}/note`)
        .send({ userNote: 'test note' })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
    });

    it("should not allow volunteer to modify other user's note", async () => {
      const { token } = await TestApiHelpers.getToken(volunteer);
      const res = await request(app)
        .put(`/api/users/${staff.uuid}/note`)
        .send({ userNote: 'test note' })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should allow staff to modify other user note', async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const newUserNote = 'test note';
      const res = await request(app)
        .put(`/api/users/${volunteer.uuid}/note`)
        .send({ userNote: newUserNote })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(201);
      const updatedUser = await getUserByUuid(volunteer.uuid);
      expect(updatedUser?.userNote).toEqual(newUserNote);
    });

    it('should not do anything if the user does not exist', async () => {
      const { token } = await TestApiHelpers.getToken(staff);
      const res = await request(app)
        .put(`/api/users/random-uuid/note`)
        .send({ userNote: 'test note' })
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

      // TODO: add support for the API, so it's possible to differenciate between
      // user not found and other update operation errors
      // Currently, we always returns 400 if the update operation fails, which is not ideal...
      expect(res.statusCode).toEqual(400);
    });
  });
});
