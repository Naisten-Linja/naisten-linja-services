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
  bookingNote: string;
}

interface BookingQueryResult {
  uuid: string;
  user_uuid: string;
  phone: string;
  full_name: string;
  email: string;
  booking_type_uuid: string;
  booking_note: string;
  start_time: Date;
  end_time: Date;
  created: string;
}

function queryResultToBooking(row: BookingQueryResult): Booking {
  const {
    uuid,
    user_uuid,
    booking_type_uuid,
    booking_note,
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
    bookingNote: booking_note,
  };
}

export type CreateBookingParams = {
  userUuid: string;
  phone: string;
  fullName: string;
  email: string;
  bookingTypeUuid: string;
  bookingNote: string;
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
  bookingNote,
}: CreateBookingParams): Promise<Booking | null> {
  try {
    const queryText = `
        INSERT INTO bookings (user_uuid, booking_type_uuid, full_name, email, phone, start_time, end_time, booking_note)
        VALUES ($1::text, $2::text, $3::text, $4::text, $5::text, $6::timestamp, $7::timestamp, $8::text)
        RETURNING *;
    `;
    const queryValues = [
      userUuid,
      bookingTypeUuid,
      fullName,
      email,
      phone,
      start,
      end,
      bookingNote,
    ];
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
      WHERE user_uuid = $1::text;
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

export async function deleteBooking(uuid: string): Promise<boolean> {
  try {
    const queryText = 'DELETE from bookings WHERE uuid = $1::text;';
    const result = await db.query(queryText, [uuid]);
    return result.rowCount > 0;
  } catch (err) {
    console.error(`Failed to delete booking ${uuid}`);
    console.error(err);
    return false;
  }
}

export type UpdateBookingParams = {
  uuid: string;
  phone: string;
  fullName: string;
  email: string;
  bookingNote: string;
};

export async function updateBooking({
  uuid,
  phone,
  fullName,
  email,
  bookingNote,
}: UpdateBookingParams): Promise<Booking | null> {
  try {
    const queryText = `
      UPDATE bookings
      SET phone = $1::text, full_name = $2::text, email = $3::text, booking_note = $4::text
      WHERE uuid = $5::text
      RETURNING *;
    `;
    const queryValues = [phone, fullName, email, bookingNote, uuid];
    const result = await db.query<BookingQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToBooking(result.rows[0]);
  } catch (err) {
    console.error(`Failed to update booking ${uuid}`);
    console.error(err);
    return null;
  }
}
