import db from '../db';

interface Booking {
  uuid: string;
  userUuid: string;
  phone: string;
  fullName: string;
  email: string;
  bookingTypeUuid: string;
  start: Date;
  end: Date;
  created: string;
}

interface BookingQueryResult {
  uuid: string;
  user_uuid: string;
  phone: string;
  full_name: string;
  email: string;
  booking_type_uuid: string;
  start_time: Date;
  end_time: Date;
  created: string;
}

function queryResultToBooking(row: BookingQueryResult): Booking {
  const {
    uuid,
    user_uuid,
    booking_type_uuid,
    full_name,
    email,
    phone,
    created,
    start_time,
    end_time,
  } = row;
  return {
    uuid,
    created,
    email,
    phone,
    start: start_time,
    end: end_time,
    userUuid: user_uuid,
    fullName: full_name,
    bookingTypeUuid: booking_type_uuid,
  };
}

export type CreateBookingParams = {
  userUuid: string;
  phone: string;
  fullName: string;
  email: string;
  bookingTypeUuid: string;
  start: Date;
  end: Date;
};

export async function createBooking({
  userUuid,
  phone,
  fullName,
  email,
  bookingTypeUuid,
  start,
  end,
}: CreateBookingParams): Promise<Booking | null> {
  try {
    const queryText = `
        INSERT INTO bookings (user_uuid, booking_type_uuid, full_name, email, phone, start_time, end_time)
        VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::timestamp, $7::timestamp)
        RETURNING *;
    `;
    const queryValues = [userUuid, bookingTypeUuid, fullName, email, phone, start, end];
    const result = await db.query<BookingQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToBooking(result.rows[0]);
  } catch (err) {
    console.error('Failed to create a new booking');
    console.error(err);
    return null;
  }
}

export async function getUserBookings(userUuid: string): Promise<Array<Booking> | null> {
  try {
    const queryText = `
      SELECT * from bookings
      WHERE user_id = $1::text;
    `;
    const queryValues = [userUuid];
    const result = await db.query<BookingQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return result.rows.map((r) => queryResultToBooking(r));
  } catch (err) {
    console.error(`Failed to get bookings for user ${userUuid}`);
    console.error(err);
    return null;
  }
}

export async function getAllBookings(): Promise<Array<Booking> | null> {
  try {
    const queryText = 'SELECT * from bookings;';
    const result = await db.query<BookingQueryResult>(queryText, []);
    if (result.rows.length < 1) {
      return null;
    }
    return result.rows.map((r) => queryResultToBooking(r));
  } catch (err) {
    console.error('Failed to query all bookings');
    console.error(err);
    return null;
  }
}
