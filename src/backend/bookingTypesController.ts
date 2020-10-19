import {
  createBookingType,
  getAllBookingTypes,
  CreateBookingTypeParams,
} from './models/bookingTypes';

import { ApiBookingType } from '../common/constants-common';

export async function addBookingType({
  name,
  rules,
}: CreateBookingTypeParams): Promise<ApiBookingType | null> {
  const bookingType = await createBookingType({
    name,
    rules,
  });
  return bookingType
    ? {
        uuid: bookingType.uuid,
        name: bookingType.name,
        rules: bookingType.rules,
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
      }))
    : null;
}
