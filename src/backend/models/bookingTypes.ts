import db from '../db';

import { BookingTypeRules, BookingTypeExceptions } from '../../common/constants-common';

export interface CreateBookingTypeParams {
  name: string;
  rules: BookingTypeRules;
  exceptions: BookingTypeExceptions;
}

export interface BookingType {
  id: number;
  uuid: string;
  name: string;
  rules: BookingTypeRules;
  exceptions: BookingTypeExceptions;
  created: number;
}

export interface BookingTypeQueryResult {
  id: number;
  uuid: string;
  name: string;
  created: number;
  rules: BookingTypeRules;
  exceptions: BookingTypeExceptions;
}

function queryResultToBookingType(row: BookingTypeQueryResult): BookingType {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    created: row.created,
    rules: row.rules,
    exceptions: row.exceptions || [],
  };
}

export async function createBookingType({
  name,
  rules,
  exceptions,
}: CreateBookingTypeParams): Promise<BookingType | null> {
  try {
    const queryText = `
        INSERT INTO booking_types (name, rules, exceptions)
        VALUES ($1::text, $2::jsonb, $3::jsonb)
        RETURNING *;
    `;
    const queryValues = [name, rules, exceptions];
    const result = await db.query<BookingTypeQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToBookingType(result.rows[0]);
  } catch (err) {
    console.error(`Failed to create a new booking type with name ${name}`);
    console.error(err);
    return null;
  }
}

export async function getAllBookingTypes(): Promise<Array<BookingType> | null> {
  try {
    const queryText = `SELECT * from booking_types;`;
    const result = await db.query<BookingTypeQueryResult>(queryText, []);
    if (result.rows.length < 1) {
      return [];
    }
    return result.rows.map((r) => queryResultToBookingType(r));
  } catch (err) {
    console.error('Unable to fetch all booking types');
    console.error(err);
    return null;
  }
}
