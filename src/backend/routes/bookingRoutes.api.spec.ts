/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers } from '../test-utils';
import { User } from '../models/users';
import { BookingType } from '../models/bookingTypes';
import { createBooking } from '../models/bookings';
import { modelBookingToApiBooking } from '../controllers/bookingControllers';
import { modelBookingTypeToApiBookingType } from '../controllers/bookingTypeControllers';
import { ApiBookingTypeWithColor, BookingTypeColors } from '../../common/constants-common';

describe('bookingRoutes', () => {
  let app: express.Application;
  let volunteerUser: User;
  let staffUser: User;
  let unassignedUser: User;

  let phoneBookingType: BookingType;
  let phoneBookingTypeWithColor: ApiBookingTypeWithColor;
  let letterBookingType: BookingType;
  let letterBookingTypeWithColor: ApiBookingTypeWithColor;

  beforeAll(async () => {
    app = await TestApiHelpers.getApp();
    [staffUser, volunteerUser, unassignedUser] = await TestApiHelpers.populateTestUsers();
    [phoneBookingType, letterBookingType] = await TestApiHelpers.populateBookingTypes();
    phoneBookingTypeWithColor = {
      ...modelBookingTypeToApiBookingType(phoneBookingType),
      color: BookingTypeColors[0],
    };
    letterBookingTypeWithColor = {
      ...modelBookingTypeToApiBookingType(letterBookingType),
      color: BookingTypeColors[1],
    };
  });

  function createMockPhoneBookingParams(user: User) {
    return {
      userUuid: user.uuid,
      phone: '123456789',
      fullName: user.fullName || '',
      email: user.email,
      bookingTypeUuid: phoneBookingType.uuid,
      bookingNote: 'test phone booking',
      start: new Date('Thu Feb 15 2085 10:00 GMT+0300'),
      end: new Date('Thu Feb 15 2085 11:30 GMT+0300'),
      workingRemotely: false,
    };
  }

  function createMockLetterBookingParams(user: User) {
    return {
      userUuid: user.uuid,
      phone: '123456789',
      fullName: user.fullName || '',
      email: user.email,
      bookingTypeUuid: letterBookingType.uuid,
      bookingNote: 'test letter booking',
      start: new Date('Mon Feb 12 2085 14:00 GMT+0300'),
      end: new Date('Mon Feb 12 2085 19:00 GMT+0300'),
      workingRemotely: true,
    };
  }

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  describe('GET /api/bookings', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).get('/api/bookings').set('Accept', 'application/json');

      expect(res.statusCode).toEqual(401);
      expect(res.body?.data).toBeUndefined();
      expect(res.body?.error).not.toBeEmpty();
    });

    it('should not allow unassigned user to view their own bookings', async () => {
      const { token } = await TestApiHelpers.getToken(unassignedUser);
      const res = await request(app)
        .get('/api/bookings')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should allow volunteers and staff user to view their own bookings', async () => {
      const users = [volunteerUser, staffUser];

      for (let i = 0; i < users.length; i++) {
        // When there is no booking
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);
        let res = await request(app)
          .get('/api/bookings')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(200);
        expect(res.body?.data).toEqual([]);

        // When there are bookings
        const userPhoneBooking = await createBooking(createMockPhoneBookingParams(user));
        expect(userPhoneBooking).not.toBeNull();
        if (!userPhoneBooking) {
          return;
        }

        const userLetterBooking = await createBooking(createMockLetterBookingParams(user));

        expect(userLetterBooking).not.toBeNull();
        if (!userLetterBooking) {
          return;
        }

        res = await request(app)
          .get('/api/bookings')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(200);
        expect(res.body?.data).toIncludeAllMembers([
          modelBookingToApiBooking(userPhoneBooking, phoneBookingTypeWithColor, user),
          modelBookingToApiBooking(userLetterBooking, letterBookingTypeWithColor, user),
        ]);
      }
    });
  });
});
