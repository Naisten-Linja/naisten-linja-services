import * as model from '../models/bookingTypes';

import {
  ApiBookingType,
  ApiBookingTypeWithColor,
  BookingTypeColors,
} from '../../common/constants-common';

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

export async function getBookingTypes(): Promise<Array<ApiBookingTypeWithColor> | null> {
  const allBookingTypes = await model.getAllBookingTypes();
  return allBookingTypes !== null
    ? allBookingTypes
        .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
        .map((b, index) => ({
          uuid: b.uuid,
          name: b.name,
          rules: b.rules,
          exceptions: b.exceptions,
          dateRanges: b.dateRanges,
          additionalInformation: b.additionalInformation,
          color: BookingTypeColors[index % Object.keys(BookingTypeColors).length],
        }))
    : null;
}

export async function getBookingTypeByUuid(
  bookingTypeUuid: string,
): Promise<ApiBookingTypeWithColor | null> {
  // const bookingType = await model.getBookingTypeByUuid(bookingTypeUuid);
  // if (bookingType === null) {
  //   return null;
  // }
  // const { uuid, name, rules, exceptions, additionalInformation } = bookingType;
  // return {
  //   uuid,
  //   name,
  //   rules,
  //   exceptions,
  //   additionalInformation,
  // };
  const bookingTypes = await getBookingTypes();
  if (bookingTypes === null) {
    return null;
  }
  const result = bookingTypes.find((b) => b.uuid === bookingTypeUuid) || null;
  return result;
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
