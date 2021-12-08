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
    .map(({ email, phone, fullName, bookingTypeUuid, start, end, uuid, bookingNote }) => ({
      uuid,
      email,
      phone,
      fullName,
      user,
      bookingNote,
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
    .map(
      ({ uuid, email, phone, fullName, bookingTypeUuid, bookingNote, userUuid, start, end }) => ({
        uuid,
        email,
        phone,
        fullName,
        bookingNote,
        user: users.find(({ uuid }) => uuid === userUuid),
        start: start.toString(),
        end: end.toString(),
        bookingType: bookingTypes.find(({ uuid }) => uuid === bookingTypeUuid) || null,
      }),
    )
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
  const { uuid, email, phone, fullName, bookingTypeUuid, start, end, bookingNote } = newBooking;
  const bookingType = await bookingTypesController.getBookingTypeByUuid(bookingTypeUuid);
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
    bookingNote,
    start: start.toString(),
    end: end.toString(),
  };
}

export async function deleteBooking(uuid: string): Promise<boolean> {
  return await bookingsModel.deleteBooking(uuid);
}

export async function updateBooking(
  params: bookingsModel.UpdateBookingParams,
): Promise<ApiBooking | null> {
  const updatedBooking = await bookingsModel.updateBooking(params);
  if (updatedBooking === null) {
    return null;
  }
  const { uuid, email, phone, fullName, bookingTypeUuid, bookingNote, userUuid, start, end } =
    updatedBooking;
  const bookingType = await bookingTypesController.getBookingTypeByUuid(bookingTypeUuid);
  if (!bookingType) {
    return null;
  }
  const user = await usersModel.getUserByUuid(userUuid);
  if (user === null) {
    return null;
  }
  return {
    uuid,
    email,
    phone,
    fullName,
    bookingType,
    bookingNote,
    user,
    start: start.toString(),
    end: end.toString(),
  };
}
