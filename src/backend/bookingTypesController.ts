import {
  createBookingType,
  getAllBookingTypes,
  CreateBookingTypeParams,
} from './models/bookingTypes';

import { ApiBookingType } from '../common/constants-common';

export async function addBookingType({
  name,
  rules,
  exceptions,
}: CreateBookingTypeParams): Promise<ApiBookingType | null> {
  const bookingType = await createBookingType({
    name,
    rules,
    exceptions,
  });
  return bookingType
    ? {
        uuid: bookingType.uuid,
        name: bookingType.name,
        rules: bookingType.rules,
        exceptions: bookingType.exceptions,
      }
    : null;
}

export async function getBookingTypes(): Promise<Array<ApiBookingType> | null> {
  const allBookingTypes = await getAllBookingTypes();
  return allBookingTypes !== null
    ? allBookingTypes.map((b) => ({
        uuid: b.uuid,
        name: b.name,
        rules: b.rules,
        exceptions: b.exceptions,
      }))
    : null;
}
