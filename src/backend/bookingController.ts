import { ApiBooking } from '../common/constants-common';

import * as bookingTypesController from './bookingTypesController';
import * as bookingsModel from './models/bookings';
import * as usersModel from './models/users';

export async function getUserBookings(userUuid: string): Promise<Array<ApiBooking> | null> {
  const user = await usersModel.getUserByUuid(userUuid);
  if (!user) {
    console.log(`User ${userUuid} not found`);
    return null;
  }
  const bookings = await bookingsModel.getUserBookings(userUuid);
  if (bookings === null) {
    return null;
  }
  const bookingTypes = (await bookingTypesController.getBookingTypes()) || [];
  return bookings
    .map(({ email, phone, fullName, bookingTypeUuid, start, end, uuid }) => ({
      uuid,
      email,
      phone,
      fullName,
      user,
      start: start.toString(),
      end: end.toString(),
      bookingType: bookingTypes.find(({ uuid }) => uuid === bookingTypeUuid) || null,
    }))
    .filter(({ bookingType }) => !!bookingType) as Array<ApiBooking>;
}

export async function getAllBookings(): Promise<Array<ApiBooking> | null> {
  const users = await usersModel.getUsers();
  const bookings = await bookingsModel.getAllBookings();
  if (bookings === null || users === null) {
    return null;
  }
  const bookingTypes = (await bookingTypesController.getBookingTypes()) || [];
  return bookings
    .map(({ uuid, email, phone, fullName, bookingTypeUuid, userUuid, start, end }) => ({
      uuid,
      email,
      phone,
      fullName,
      user: users.find(({ uuid }) => uuid === userUuid),
      start: start.toString(),
      end: end.toString(),
      bookingType: bookingTypes.find(({ uuid }) => uuid === bookingTypeUuid) || null,
    }))
    .filter(({ user }) => !!user) as Array<ApiBooking>;
}

export async function createBooking(
  params: bookingsModel.CreateBookingParams,
): Promise<ApiBooking | null> {
  const user = await usersModel.getUserByUuid(params.userUuid);
  if (!user) {
    console.log(`User ${params.userUuid} not found`);
    return null;
  }
  const newBooking = await bookingsModel.createBooking(params);
  if (!newBooking) {
    return null;
  }
  const bookingTypes = (await bookingTypesController.getBookingTypes()) || [];
  const { uuid, email, phone, fullName, bookingTypeUuid, start, end } = newBooking;
  const bookingType = bookingTypes.find(({ uuid }) => uuid === bookingTypeUuid);
  if (!bookingType) {
    return null;
  }
  return {
    uuid,
    email,
    phone,
    fullName,
    user,
    bookingType,
    start: start.toString(),
    end: end.toString(),
  };
}
