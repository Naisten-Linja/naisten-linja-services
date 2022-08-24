import * as model from '../models/bookingTypes';

import { ApiBookingType } from '../../common/constants-common';

export async function addBookingType({
  name,
  rules,
  exceptions,
  dateRanges,
  additionalInformation,
}: model.CreateBookingTypeParams): Promise<ApiBookingType | null> {
  const bookingType = await model.createBookingType({
    name,
    rules,
    exceptions,
    dateRanges,
    additionalInformation,
  });
  return bookingType
    ? {
        uuid: bookingType.uuid,
        name: bookingType.name,
        rules: bookingType.rules,
        exceptions: bookingType.exceptions,
        dateRanges: bookingType.dateRanges,
        additionalInformation: bookingType.additionalInformation,
      }
    : null;
}

export async function getBookingTypes(): Promise<Array<ApiBookingType> | null> {
  const allBookingTypes = await model.getAllBookingTypes();
  return allBookingTypes !== null
    ? allBookingTypes.map((b) => ({
        uuid: b.uuid,
        name: b.name,
        rules: b.rules,
        exceptions: b.exceptions,
        dateRanges: b.dateRanges,
        additionalInformation: b.additionalInformation,
      }))
    : null;
}

export async function getBookingTypeByUuid(
  bookingTypeUuid: string,
): Promise<ApiBookingType | null> {
  const bookingType = await model.getBookingTypeByUuid(bookingTypeUuid);
  if (bookingType === null) {
    return null;
  }
  const { uuid, name, rules, exceptions, dateRanges, additionalInformation } = bookingType;
  return { uuid, name, rules, exceptions, dateRanges, additionalInformation };
}

export async function updateBookingType({
  uuid,
  name,
  rules,
  exceptions,
  dateRanges,
  additionalInformation,
}: model.UpdateBookingTypeParams): Promise<ApiBookingType | null> {
  const bookingType = await model.updateBookingType({
    uuid,
    name,
    rules,
    exceptions,
    dateRanges,
    additionalInformation,
  });
  return bookingType !== null
    ? {
        uuid: bookingType.uuid,
        name: bookingType.name,
        rules: bookingType.rules,
        exceptions: bookingType.exceptions,
        dateRanges: bookingType.dateRanges,
        additionalInformation: bookingType.additionalInformation,
      }
    : null;
}

export async function deleteBookingType(uuid: string) {
  return await model.deleteBookingType(uuid);
}
