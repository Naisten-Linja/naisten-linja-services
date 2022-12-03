import db from '../db';

import { BookingTypeDailyRules, BookingTypeDateRange } from '../../common/constants-common';

export interface CreateBookingTypeParams {
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  dateRanges: Array<BookingTypeDateRange>;
  additionalInformation: string;
  flexibleLocation: boolean;
}

export interface UpdateBookingTypeParams {
  uuid: string;
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  dateRanges: Array<BookingTypeDateRange>;
  additionalInformation: string;
  flexibleLocation: boolean;
}

export interface BookingType {
  id: number;
  uuid: string;
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  dateRanges: Array<BookingTypeDateRange>;
  created: number;
  additionalInformation: string | null;
  flexibleLocation: boolean;
}

export interface BookingTypeQueryResult {
  id: number;
  uuid: string;
  name: string;
  created: number;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  date_ranges: Array<BookingTypeDateRange>;
  additional_information?: string | null;
  flexible_location: boolean;
}

function queryResultToBookingType(row: BookingTypeQueryResult): BookingType {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    created: row.created,
    rules: row.rules,
    exceptions: row.exceptions,
    dateRanges: row.date_ranges,
    additionalInformation: row.additional_information || null,
    flexibleLocation: row.flexible_location,
  };
}

export async function createBookingType({
  name,
  rules,
  exceptions = [],
  dateRanges,
  additionalInformation,
  flexibleLocation,
}: CreateBookingTypeParams): Promise<BookingType | null> {
  try {
    const queryText = `
        INSERT INTO booking_types (name, rules, exceptions, date_ranges, additional_information, flexible_location)
        VALUES ($1::text, $2::jsonb[], $3::text[], $4::jsonb[], $5::text, $6::boolean)
        RETURNING *;
    `;
    const queryValues = [
      name,
      rules,
      exceptions,
      dateRanges,
      additionalInformation,
      flexibleLocation,
    ];
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

export async function getBookingTypeByUuid(uuid: string): Promise<BookingType | null> {
  try {
    const queryText = 'SELECT * from booking_types WHERE uuid = $1::text;';
    const result = await db.query<BookingTypeQueryResult>(queryText, [uuid]);
    if (result.rows.length < 1) {
      return null;
    }
    return queryResultToBookingType(result.rows[0]);
  } catch (err) {
    console.error(`Unable to fetch booking type ${uuid}`);
    console.error(err);
    return null;
  }
}

export async function updateBookingType({
  name,
  rules,
  exceptions,
  dateRanges,
  uuid,
  additionalInformation,
  flexibleLocation,
}: UpdateBookingTypeParams): Promise<BookingType | null> {
  try {
    const queryText = `
        UPDATE booking_types
        SET
          name = $1::text,
          rules = $2::jsonb[],
          exceptions = $3::text[],
          date_ranges = $4::jsonb[],
          additional_information = $5::text,
          flexible_location = $6::boolean
        WHERE uuid = $7::text
        RETURNING *;
    `;
    const queryValues = [
      name,
      rules,
      exceptions,
      dateRanges,
      additionalInformation,
      flexibleLocation,
      uuid,
    ];
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
        DELETE FROM booking_types
        WHERE uuid = $1::text;
    `;
    const result = await db.query<BookingTypeQueryResult>(queryText, [uuid]);
    return result.rowCount > 0;
  } catch (err) {
    console.error(`Failed to delete booking type with uuid ${uuid}`);
    console.error(err);
    return false;
  }
}
