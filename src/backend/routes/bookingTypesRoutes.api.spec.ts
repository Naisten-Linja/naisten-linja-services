/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers } from '../test-utils';
import { User } from '../models/users';
import { BookingType, getBookingTypeByUuid, createBookingType } from '../models/bookingTypes';
import { modelBookingTypeToApiBookingType } from '../controllers/bookingTypeControllers';
import { BookingTypeColors } from '../../common/constants-common';

describe('bookingTypesRoutes', () => {
  let app: express.Application;
  let volunteerUser: User;
  let staffUser: User;
  let unassignedUser: User;

  let phoneBookingType: BookingType;
  let letterBookingType: BookingType;

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  beforeEach(async () => {
    await TestApiHelpers.resetDb();
    [staffUser, volunteerUser, unassignedUser] = await TestApiHelpers.populateTestUsers();
    [phoneBookingType, letterBookingType] = await TestApiHelpers.populateBookingTypes();
  });

  afterEach(async () => {
    await TestApiHelpers.resetDb();
  });

  describe('GET /api/booking-types', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).get('/api/booking-types').set('Accept', 'application/json');

      expect(res.statusCode).toEqual(401);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not allow unassigned user to fetch booking types', async () => {
      const { token } = await TestApiHelpers.getToken(unassignedUser);
      const res = await request(app)
        .get('/api/booking-types')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should allow volunteer and staff to fetch booking types', async () => {
      const users = [volunteerUser, staffUser];
      for (let i = 0; i < 2; i++) {
        const { token } = await TestApiHelpers.getToken(users[i]);
        const res = await request(app)
          .get('/api/booking-types')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(2);
        expect(res.body.data).toIncludeAllMembers(
          [letterBookingType, phoneBookingType].map((b, i) => {
            return {
              ...modelBookingTypeToApiBookingType(b),
              color: BookingTypeColors[i % BookingTypeColors.length],
            };
          }),
        );
      }
    });
  });

  const exceptionDate = new Date().toUTCString();
  const workshopBookingParams = {
    name: 'Online workshop',
    rules: [
      { enabled: true, slots: [] },
      { enabled: true, slots: [] },
      {
        enabled: true,
        slots: [{ start: '11:45', end: '13:30', seats: 3 }],
      },
      {
        enabled: true,
        slots: [
          { start: '10:00', end: '11:30', seats: 10 },
          { start: '14:00', end: '19:00', seats: 1 },
        ],
      },
      { enabled: true, slots: [] },
      { enabled: true, slots: [] },
      { enabled: true, slots: [] },
    ],
    exceptions: [exceptionDate],
    dateRanges: [],
    additionalInformation: 'this is a test booking',
  };

  describe('POST /api/booking-types', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/booking-types')
        .send(workshopBookingParams)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteer or unassigned user to create a new booking type', async () => {
      const users = [volunteerUser, unassignedUser];
      for (let i = 0; i < 2; i++) {
        const { token } = await TestApiHelpers.getToken(users[i]);
        const res = await request(app)
          .post('/api/booking-types')
          .send(workshopBookingParams)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();
      }
    });

    it('should allow staff user to create a new booking type', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      const res = await request(app)
        .post('/api/booking-types')
        .send(workshopBookingParams)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.uuid).not.toBeEmpty();

      expect({ ...res.body.data, uuid: undefined }).toEqual({
        name: 'Online workshop',
        rules: [
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
          { enabled: true, slots: [{ end: '13:30', seats: 3, start: '11:45' }] },
          {
            enabled: true,
            slots: [
              { end: '11:30', seats: 10, start: '10:00' },
              { end: '19:00', seats: 1, start: '14:00' },
            ],
          },
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
        ],
        additionalInformation: 'this is a test booking',
        dateRanges: [],
        exceptions: [exceptionDate],
      });

      // And now there should now be 3 booking types in total
      const res2 = await request(app)
        .get('/api/booking-types')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res2.statusCode).toEqual(200);
      expect(res2.body?.data?.length).toEqual(3);
    });
  });

  describe('PUT /api/booking-types/:uuid', () => {
    const updateData = {
      name: 'Phone booking (updated)',
      rules: [
        { enabled: true, slots: [{ start: '04:00', end: '17:00', seats: 3 }] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
        { enabled: true, slots: [] },
      ],
      exceptions: [],
      additionalInformation: 'booking type updated',
      dateRanges: [],
    };

    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .put(`/api/booking-types/${phoneBookingType.uuid}`)
        .send(updateData)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteer or unassigned users to modify booking type', async () => {
      const users = [volunteerUser, unassignedUser];
      for (let i = 0; i < users.length; i++) {
        const { token } = await TestApiHelpers.getToken(users[i]);
        const res = await request(app)
          .put(`/api/booking-types/${phoneBookingType.uuid}`)
          .send(updateData)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
      }
    });

    it('should allow staff user to modify booking type', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      const res = await request(app)
        .put(`/api/booking-types/${phoneBookingType.uuid}`)
        .send(updateData)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual({
        ...updateData,
        uuid: phoneBookingType.uuid,
      });

      // And doulble check if the phone booking type is correctly updated in the database
      const updatedBookingType = await getBookingTypeByUuid(phoneBookingType.uuid);
      expect(updatedBookingType).not.toBeNull();
      if (updatedBookingType) {
        expect(modelBookingTypeToApiBookingType(updatedBookingType)).toEqual({
          ...updateData,
          uuid: phoneBookingType.uuid,
        });
      }
    });
  });

  describe('DELETE /api/booking-types/:uuid', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .delete(`/api/booking-types/${phoneBookingType.uuid}`)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
    });

    it('should not allow volunteer or unassigned users delete booking types', async () => {
      const users = [volunteerUser, unassignedUser];
      for (let i = 0; i < users.length; i++) {
        const { token } = await TestApiHelpers.getToken(users[i]);
        const res = await request(app)
          .delete(`/api/booking-types/${phoneBookingType.uuid}`)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
      }
    });

    it('should allow staff user to delete booking type', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);

      // First, create another booking type
      const newBookingType = await createBookingType({
        name: 'New booking type',
        rules: [
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
          { enabled: true, slots: [] },
        ],
        exceptions: [],
        dateRanges: [],
        additionalInformation: 'new booking tye',
      });

      expect(newBookingType).not.toBeNull();
      if (!newBookingType) {
        return;
      }

      const res = await request(app)
        .delete(`/api/booking-types/${newBookingType.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });
      expect(res.statusCode).toEqual(204);

      // And the booking type should be deleted from the database
      const foundBookingType = await getBookingTypeByUuid(newBookingType.uuid);
      expect(foundBookingType).toBeNull();
    });

    it('should returns 404 if staff tries to delete a non-existing booking type', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      const res = await request(app)
        .delete(`/api/booking-types/random-uuid`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(404);
    });
  });
});
