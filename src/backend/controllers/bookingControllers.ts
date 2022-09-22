import {
  ApiBooking,
  ApiBookingType,
  ApiBookingTypeWithColor,
  ApiBookingUserStats,
  ApiBookingWithColor,
} from '../../common/constants-common';

import * as bookingTypesController from './bookingTypeControllers';
import * as bookingsModel from '../models/bookings';
import * as usersModel from '../models/users';

export async function getUserBookings(
  userUuid: string,
): Promise<Array<ApiBookingWithColor> | null> {
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
    .map((booking) => {
      const bookingType = bookingTypes.find(({ uuid }) => uuid === booking.bookingTypeUuid) || null;
      return modelBookingToApiBooking(booking, bookingType, user);
    })
    .filter((result) => result !== null) as Array<ApiBookingWithColor>;
}

export async function getAllBookings(): Promise<Array<ApiBookingWithColor> | null> {
  const users = await usersModel.getUsers();
  const bookings = await bookingsModel.getAllBookings();
  if (bookings === null || users === null) {
    return null;
  }
  const bookingTypes = (await bookingTypesController.getBookingTypes()) || [];

  return bookings
    .map(
      ({
        uuid,
        email,
        phone,
        fullName,
        bookingTypeUuid,
        bookingNote,
        userUuid,
        start,
        end,
        workingRemotely,
      }) => ({
        uuid,
        email,
        phone,
        fullName,
        bookingNote,
        workingRemotely,
        user: users.find(({ uuid }) => uuid === userUuid),
        start: start.toString(),
        end: end.toString(),
        bookingType: bookingTypes.find(({ uuid }) => uuid === bookingTypeUuid) || null,
      }),
    )
    .filter(({ user }) => !!user) as Array<ApiBookingWithColor>;
}

export async function createBooking(
  params: bookingsModel.CreateBookingParams,
): Promise<ApiBooking | null> {
  const newBooking = await bookingsModel.createBooking(params);
  if (!newBooking) {
    return null;
  }
  return await bookingModelToApiBooking(newBooking);
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
  return await bookingModelToApiBooking(updatedBooking);
}

async function bookingModelToApiBooking(
  booking: bookingsModel.Booking,
  user?: usersModel.User | null,
  bookingType?: ApiBookingType | null,
): Promise<ApiBooking | null> {
  user = user ?? (await usersModel.getUserByUuid(booking.userUuid));
  if (!user) {
    return null;
  }
  bookingType =
    bookingType ?? (await bookingTypesController.getBookingTypeByUuid(booking.bookingTypeUuid));
  if (!bookingType) {
    return null;
  }
  const { uuid, email, phone, fullName, bookingNote, start, end, workingRemotely } = booking;
  return {
    uuid,
    email,
    phone,
    fullName,
    bookingType,
    bookingNote,
    workingRemotely,
    user,
    start: start.toString(),
    end: end.toString(),
  };
}

export async function getBookingUserStats(
  bookingType: string | undefined,
): Promise<ApiBookingUserStats[] | null> {
  const bookings = await getAllBookings();
  if (bookings === null) {
    return null;
  }
  const bookingsByUser = bookings
    .filter(
      (booking) => typeof bookingType === 'undefined' || booking.bookingType.uuid === bookingType,
    )
    .reduce<Record<string, ApiBookingWithColor[]>>((obj, booking) => {
      const u_uuid = booking.user.uuid;
      return {
        ...obj,
        [u_uuid]: [...(obj[u_uuid] || []), booking],
      };
    }, {});

  const now = new Date();

  return Object.entries(bookingsByUser).map(([uuid, bookings]) => {
    const [previous, upcoming] = bookings.reduce<[ApiBookingWithColor[], ApiBookingWithColor[]]>(
      ([previous, upcoming], booking) => {
        if (new Date(booking.end) > now) {
          // ongoing bookings are upcoming bookings
          return [previous, [...upcoming, booking]];
        } else {
          return [[...previous, booking], upcoming];
        }
      },
      [[], []],
    );
    previous.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
    upcoming.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return {
      uuid,
      previousBooking: previous.length > 0 ? previous[0] : null,
      upcomingBooking: upcoming.length > 0 ? upcoming[0] : null,
      totalPrevious: previous.length,
      totalUpcoming: upcoming.length,
    };
  });
}

export function modelBookingToApiBooking(
  booking: bookingsModel.Booking,
  bookingType: ApiBookingTypeWithColor | null,
  user: usersModel.User,
): ApiBookingWithColor | null {
  if (!bookingType) {
    return null;
  }
  const { email, phone, fullName, start, end, uuid, bookingNote, workingRemotely } = booking;
  return {
    uuid,
    email,
    phone,
    fullName,
    bookingNote,
    workingRemotely,
    user,
    start: start.toString(),
    end: end.toString(),
    bookingType,
  };
}
