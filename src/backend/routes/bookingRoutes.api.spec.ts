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
      color: BookingTypeColors[1],
    };
    letterBookingTypeWithColor = {
      ...modelBookingTypeToApiBookingType(letterBookingType),
      color: BookingTypeColors[0],
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
        expect(res.body?.data).toIncludeAllMembers([
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

  describe('GET /api/bookings/user/:userUuid', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/api/bookings/user/${volunteerUser.uuid}`)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should not allow volunteer or unassigned users access', async () => {
      const users = [volunteerUser, unassignedUser];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);
        const res = await request(app)
          .get(`/api/bookings/user/${user.uuid}`)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();
      }
    });

    it("should allow staff to view any other's bookings", async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);

      // When there is no booking
      let res = await request(app)
        .get(`/api/bookings/user/${volunteerUser.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);

      // When there are bookings for the user
      const letterBooking = await createBooking(createMockLetterBookingParams(volunteerUser));
      const phoneBooking = await createBooking(createMockPhoneBookingParams(volunteerUser));

      expect(phoneBooking).not.toBeNull();
      expect(letterBooking).not.toBeNull();
      if (!phoneBooking || !letterBooking) {
        return;
      }

      res = await request(app)
        .get(`/api/bookings/user/${volunteerUser.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(2);
      expect(res.body.data).toIncludeAllMembers([
        modelBookingToApiBooking(phoneBooking, phoneBookingTypeWithColor, volunteerUser),
        modelBookingToApiBooking(letterBooking, letterBookingTypeWithColor, volunteerUser),
      ]);
    });
  });

  describe('GET /api/bookings/all', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app).get(`/api/bookings/all`).set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should not allow volunteer or unassigned users access', async () => {
      const users = [volunteerUser, unassignedUser];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);
        const res = await request(app)
          .get(`/api/bookings/all`)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();
      }
    });

    it('should allow staff to view all bookings', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);

      // When there is no booking
      let res = await request(app)
        .get(`/api/bookings/all`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);

      // When there are bookings
      const volunteerPhoneBooking = await createBooking(
        createMockPhoneBookingParams(volunteerUser),
      );
      const volunteerLetterBooking = await createBooking(
        createMockLetterBookingParams(volunteerUser),
      );
      const staffPhoneBooking = await createBooking(createMockPhoneBookingParams(staffUser));

      expect(volunteerPhoneBooking).not.toBeNull();
      expect(volunteerLetterBooking).not.toBeNull();
      expect(staffPhoneBooking).not.toBeNull();
      if (!volunteerPhoneBooking || !volunteerLetterBooking || !staffPhoneBooking) {
        return;
      }

      res = await request(app)
        .get(`/api/bookings/all`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(3);
      expect(res.body.data).toIncludeAllMembers([
        modelBookingToApiBooking(volunteerPhoneBooking, phoneBookingTypeWithColor, volunteerUser),
        modelBookingToApiBooking(volunteerLetterBooking, letterBookingTypeWithColor, volunteerUser),
        modelBookingToApiBooking(staffPhoneBooking, phoneBookingTypeWithColor, staffUser),
      ]);
    });
  });

  describe('GET /api/bookings/userstats', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/api/bookings/userstats`)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should not allow volunteer and unassigned to see detailed booking information', async () => {
      const users = [volunteerUser, unassignedUser];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { token } = await TestApiHelpers.getToken(user);
        const res = await request(app)
          .get('/api/bookings/userstats')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();
      }
    });

    it('should allow staff users to get detailed booking information', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);
      // When there is no booking information
      let res = await request(app)
        .get('/api/bookings/userstats')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual([]);

      // When there are booking information
      const volunteerPhoneBooking = await createBooking({
        ...createMockPhoneBookingParams(volunteerUser),
        start: new Date('Thu Jan 20 2022 10:00 GMT+0300'),
        end: new Date('Thu Jan 20 2022 11:30 GMT+0300'),
      });
      const volunteerLetterBooking = await createBooking(
        createMockLetterBookingParams(volunteerUser),
      );
      const staffPhoneBooking = await createBooking(createMockPhoneBookingParams(staffUser));

      expect(volunteerPhoneBooking).not.toBeNull();
      expect(volunteerLetterBooking).not.toBeNull();
      expect(staffPhoneBooking).not.toBeNull();
      if (!volunteerPhoneBooking || !volunteerLetterBooking || !staffPhoneBooking) {
        return;
      }

      res = await request(app)
        .get('/api/bookings/userstats')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toEqual(2);
      expect(res.body.data).toIncludeAllMembers([
        {
          uuid: staffUser.uuid,
          previousBooking: null,
          upcomingBooking: modelBookingToApiBooking(
            staffPhoneBooking,
            phoneBookingTypeWithColor,
            staffUser,
          ),
          totalPrevious: 0,
          totalUpcoming: 1,
        },
        {
          uuid: volunteerUser.uuid,
          previousBooking: {
            ...modelBookingToApiBooking(
              volunteerPhoneBooking,
              phoneBookingTypeWithColor,
              volunteerUser,
            ),
            color: undefined,
          },
          upcomingBooking: modelBookingToApiBooking(
            volunteerLetterBooking,
            letterBookingTypeWithColor,
            volunteerUser,
          ),
          totalPrevious: 1,
          totalUpcoming: 1,
        },
      ]);
    });
  });

  describe('GET /api/bookings/calendar', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .get(`/api/bookings/calendar`)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should not allow unassigned to see the booking calendar data', async () => {
      const { token } = await TestApiHelpers.getToken(unassignedUser);
      const res = await request(app)
        .get('/api/bookings/calendar')
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(403);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should allow staff and volunteer to see the booking calendar data', async () => {
      const volunteerPhoneBooking = await createBooking({
        ...createMockPhoneBookingParams(volunteerUser),
        start: new Date('Thu Jan 20 2022 10:00 GMT+0300'),
        end: new Date('Thu Jan 20 2022 11:30 GMT+0300'),
      });
      const volunteerLetterBooking = await createBooking(
        createMockLetterBookingParams(volunteerUser),
      );
      const staffPhoneBooking = await createBooking(createMockPhoneBookingParams(staffUser));

      expect(volunteerPhoneBooking).not.toBeNull();
      expect(volunteerLetterBooking).not.toBeNull();
      expect(staffPhoneBooking).not.toBeNull();
      if (!volunteerPhoneBooking || !volunteerLetterBooking || !staffPhoneBooking) {
        return;
      }

      const users = [volunteerUser, staffUser];
      for (let i = 0; i < users.length; i++) {
        const { token } = await TestApiHelpers.getToken(staffUser);

        // When there is missing date filters
        let res = await request(app)
          .get('/api/bookings/calendar')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });
        expect(res.statusCode).toEqual(400);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();

        res = await request(app)
          .get('/api/bookings/calendar?startDate=Mon Sep 19 2022 00%3A00%3A00')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });
        expect(res.statusCode).toEqual(400);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();

        res = await request(app)
          .get('/api/bookings/calendar?endDate=Mon Sep 19 2022 00%3A00%3A00')
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });
        expect(res.statusCode).toEqual(400);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();

        // When there are both startDate and endDate query and there are no booked slots
        res = await request(app)
          .get(
            '/api/bookings/calendar?' +
              'startDate=Mon Feb 05 2085 00%3A00%3A00' +
              '&endDate=Sun Feb 11 2085 00%3A00%3A00',
          )
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toEqual([]);

        // When there are both startDate and endDate query and there are some booked slots
        res = await request(app)
          .get(
            '/api/bookings/calendar?' +
              'startDate=Mon Feb 12 2085 00%3A00%3A00' +
              '&endDate=Sun Feb 18 2085 00%3A00%3A00',
          )
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(2);
        expect(res.body.data).toIncludeAllMembers([
          {
            bookingTypeUuid: phoneBookingType.uuid,
            start: staffPhoneBooking.start.toString(),
            end: staffPhoneBooking.end.toString(),
            count: 1,
          },
          {
            bookingTypeUuid: letterBookingType.uuid,
            start: volunteerLetterBooking.start.toString(),
            end: volunteerLetterBooking.end.toString(),
            count: 1,
          },
        ]);
      }
    });
  });

  describe('DELETE /api/bookings/booking/:bookingUuid', () => {
    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .delete(`/api/bookings/booking/:bookingUuid`)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should not allow volunteer and unassigned users to delete a booking', async () => {
      const users = [volunteerUser, unassignedUser];

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const booking = await createBooking(createMockLetterBookingParams(user));
        expect(booking).not.toBeNull();
        if (!booking) {
          return;
        }

        const { token } = await TestApiHelpers.getToken(user);
        const res = await request(app)
          .delete(`/api/bookings/booking/${booking.uuid}`)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();
      }
    });

    it('should allow staff to delete a booking', async () => {
      const { token } = await TestApiHelpers.getToken(staffUser);

      // When the booking does not exist
      let res = await request(app)
        .delete(`/api/bookings/booking/random-uuid`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(202);
      expect(res.body.data.success).toEqual(false);

      // When the booking exist
      const letterBooking = await createBooking(createMockLetterBookingParams(volunteerUser));
      const phoneBooking = await createBooking(createMockPhoneBookingParams(volunteerUser));
      expect(letterBooking).not.toBeNull();
      expect(phoneBooking).not.toBeNull();
      if (!letterBooking || !phoneBooking) {
        return;
      }

      res = await request(app)
        .delete(`/api/bookings/booking/${letterBooking.uuid}`)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(202);
      expect(res.body.data.success).toEqual(true);

      // And the letter booking should be deleted from the database
      const foundBookings = await getUserBookings(volunteerUser.uuid);
      expect(foundBookings).toEqual([phoneBooking]);
    });
  });

  describe('PUT /api/bookings/booking/:bookingUuid', () => {
    const editBookingParams = {
      email: 'updatedEmail@naistenlinja.fi',
      fullName: 'new full name',
      bookingNote: 'new booking note',
      phone: '987654321',
    };

    it('should not allow unauthenticated requests', async () => {
      const res = await request(app)
        .put(`/api/bookings/booking/someuuid`)
        .send(editBookingParams)
        .set({ Accept: 'application/json' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();
    });

    it('should not allow volunteer and unassigned users to modify a booking', async () => {
      const users = [volunteerUser, unassignedUser];

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const booking = await createBooking(createMockLetterBookingParams(user));
        expect(booking).not.toBeNull();
        if (!booking) {
          return;
        }

        const { token } = await TestApiHelpers.getToken(user);
        const res = await request(app)
          .put(`/api/bookings/booking/${booking.uuid}`)
          .send(editBookingParams)
          .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

        expect(res.statusCode).toEqual(403);
        expect(res.body.data).toBeUndefined();
        expect(res.body.error).not.toBeEmpty();
      }
    });

    it('should allow staff to modify a booking', async () => {
      const letterBooking = await createBooking(createMockLetterBookingParams(volunteerUser));
      expect(letterBooking).not.toBeNull();
      if (!letterBooking) {
        return;
      }

      const { token } = await TestApiHelpers.getToken(staffUser);

      // When the booking does not exist
      let res = await request(app)
        .put(`/api/bookings/booking/random-uuid`)
        .send(editBookingParams)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(400);
      expect(res.body.data).toBeUndefined();
      expect(res.body.error).not.toBeEmpty();

      // When the booking exist
      res = await request(app)
        .put(`/api/bookings/booking/${letterBooking.uuid}`)
        .send(editBookingParams)
        .set({ Accept: 'application/json', Authorization: `Bearer ${token}` });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual({
        ...modelBookingToApiBooking(letterBooking, letterBookingTypeWithColor, volunteerUser),
        ...editBookingParams,
      });
    });
  });
});
