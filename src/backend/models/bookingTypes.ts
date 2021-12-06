import db from '../db';

import { BookingTypeDailyRules } from '../../common/constants-common';

export interface CreateBookingTypeParams {
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  additionalInformation: string;
}

export interface UpdateBookingTypeParams {
  uuid: string;
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
}

export interface BookingType {
  id: number;
  uuid: string;
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  created: number;
  additionalInformation: string | null;
}

export interface BookingTypeQueryResult {
  id: number;
  uuid: string;
  name: string;
  created: number;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  additional_information?: string | null;
}

function queryResultToBookingType(row: BookingTypeQueryResult): BookingType {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    created: row.created,
    rules: row.rules,
    exceptions: row.exceptions,
    additionalInformation: row.additional_information || null,
  };
}

export async function createBookingType({
  name,
  rules,
  exceptions,
  additionalInformation,
}: CreateBookingTypeParams): Promise<BookingType | null> {
  try {
    const queryText = `
        INSERT INTO booking_types (name, rules, exceptions, additional_information)
        VALUES ($1::text, $2::jsonb[], $3::json, $4::text)
        RETURNING *;
    `;
    const queryValues = [name, rules, JSON.stringify(exceptions), additionalInformation];
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
    const queryText = `SELECT * from booking_types ORDER BY created DESC;`;
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

export async function updateBookingType({
  name,
  rules,
  exceptions,
  uuid,
}: UpdateBookingTypeParams): Promise<BookingType | null> {
  try {
    const queryText = `
        UPDATE booking_types
        SET name = $1::text, rules = $2::jsonb[], exceptions = $3::json
        WHERE uuid = $4::text
        RETURNING *;
    `;
    const queryValues = [name, rules, JSON.stringify(exceptions), uuid];
    const result = await db.query<BookingTypeQueryResult>(queryText, queryValues);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToBookingType(result.rows[0]);
  } catch (err) {
    console.error(`Failed to update booking type with name ${name}`);
    console.error(err);
    return null;
  }
}

export async function deleteBookingType(uuid: string): Promise<boolean> {
  try {
    const queryText = `
        DELETE booking_types
        WHERE uuid = $1::text
        RETURNING *;
    `;
    await db.query<BookingTypeQueryResult>(queryText, [uuid]);
    return true;
  } catch (err) {
    console.error(`Failed to delete booking type with uuid ${uuid}`);
    console.error(err);
    return false;
  }
}
