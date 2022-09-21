/// <reference types="jest-extended" />
import 'jest';
import request from 'supertest';
import express from 'express';

import { TestApiHelpers, mockEmailSending } from '../test-utils';
import { User } from '../models/users';
import { BookingType } from '../models/bookingTypes';
import { createBooking, getUserBookings } from '../models/bookings';
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
  });

  afterAll(async () => {
    await TestApiHelpers.cleanup();
  });

  beforeEach(async () => {
    await TestApiHelpers.resetDb();
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

  afterEach(async () => {
    await TestApiHelpers.resetDb();
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
        expect(res.body?.data).toIncludeAllPartialMembers([
          modelBookingToApiBooking(userPhoneBooking, phoneBookingTypeWithColor, user),
          modelBookingToApiBooking(userLetterBooking, letterBookingTypeWithColor, user),
        ]);
      }
    });
  });

  describe('POST /api/bookings', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send(createMockPhoneBookingParams(unassignedUser))
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.data).toBeUndefined();
    });

    it('should not allow unassigned user to make bookings', async () => {
      const { token } = await TestApiHelpers.getToken(unassignedUser);
      const bookingParams = createMockPhoneBookingParams(unassignedUser);
      const res = await request(app)
        .post('/api/bookings')
        .send(bookingParams)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();

      const userBookings = await getUserBookings(unassignedUser.uuid);
      expect(userBookings).toBeNull();
    });

    it('should allow volunteer and staff users to make their own bookings', async () => {
      const users = [volunteerUser, staffUser];
      const { sendBookingConfirmationEmail } = mockEmailSending();

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);
        const bookingParams = createMockPhoneBookingParams(user);
        const res = await request(app)
          .post('/api/bookings')
          .send(bookingParams)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        // Then the booking should be found from the database
        const userBookings = await getUserBookings(user.uuid);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(userBookings!.length).toEqual(1);
        if (!userBookings) {
          return;
        }
        expect(userBookings[0]).toEqual(expect.objectContaining(bookingParams));
        expect(res.statusCode).toEqual(201);
        const expectedApiBooking = modelBookingToApiBooking(
          userBookings[0],
          phoneBookingTypeWithColor,
          user,
        );
        expect(res.body.data).toEqual(expect.objectContaining(expectedApiBooking));
        expect(sendBookingConfirmationEmail).toHaveBeenCalledWith(expectedApiBooking);
      }
    });

    it('should allow staff users to make bookings for volunteers', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      const bookingParams = createMockPhoneBookingParams(volunteerUser);
      const res = await request(app)
        .post('/api/bookings')
        .send(bookingParams)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      // Then the booking should be found from the database
      const userBookings = await getUserBookings(volunteerUser.uuid);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(userBookings!.length).toEqual(1);
      if (!userBookings) {
        return;
      }
      expect(userBookings[0]).toEqual(expect.objectContaining(bookingParams));

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toEqual(
        expect.objectContaining(
          modelBookingToApiBooking(userBookings[0], phoneBookingTypeWithColor, volunteerUser),
        ),
      );

      // And the staff user should still have no booking
      const ownBookings = await getUserBookings(staffUser.uuid);
      expect(ownBookings).toBeNull();
    });
  });
});
