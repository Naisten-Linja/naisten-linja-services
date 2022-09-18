/// <reference types="jest-extended" />

import 'jest';
import request from 'supertest';
import express from 'express';

import { IntegrationHelpers } from '../test-utils';
import { ApiUserData, UserRole } from '../../common/constants-common';
import { User } from '../models/users';

describe('userRoutes', () => {
  let app: express.Application;
  let volunteer: User;
  let staff: User;

  beforeAll(async () => {
    app = await IntegrationHelpers.getApp();

    staff = await IntegrationHelpers.createTestUser(
      {
        discourseUserId: 1,
        fullName: 'Staff',
        email: 'staffUser@naistenlinja.fi',
      },
      UserRole.staff,
    );

    volunteer = await IntegrationHelpers.createTestUser(
      {
        discourseUserId: 2,
        fullName: 'Volunteer User',
        email: 'volunteerUser@naistenlinja.fi',
      },
      UserRole.volunteer,
    );
  });

  afterAll(async () => {
    await IntegrationHelpers.cleanup();
  });

  describe('GET /api/users', () => {
    it('should not allow public access by default', async () => {
      const res = await request(app).get('/api/users/').set('Accept', 'application/json');
      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteers to access user list', async () => {
      const token = await IntegrationHelpers.getToken(volunteer);
      const res = await request(app)
        .get('/api/users/')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token?.token}`);
      expect(res.statusCode).toEqual(403);
    });

    it('should allow staffs to access user list', async () => {
      const { token } = await IntegrationHelpers.getToken(staff);
      const res = await request(app)
        .get('/api/users/')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${token}`);

      const users = (res.body?.data || []) as Array<ApiUserData>;
      expect(res.statusCode).toEqual(200);
      expect(users.length).toEqual(2);
      expect(users).toIncludeAllPartialMembers(
        [staff, volunteer].map(
          ({
            email,
            uuid,
            role,
            fullName,
            created,
            userNote,
            newBookingNotificationDaysThreshold,
          }) => ({
            email,
            uuid,
            role,
            fullName,
            created,
            userNote,
            newBookingNotificationDaysThreshold,
          }),
        ),
      );
    });
  });
});
