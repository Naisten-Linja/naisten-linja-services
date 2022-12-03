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
  flexibleLocation,
}: model.CreateBookingTypeParams): Promise<ApiBookingType | null> {
  const bookingType = await model.createBookingType({
    name,
    rules,
    exceptions,
    dateRanges,
    additionalInformation,
    flexibleLocation,
  });
  return bookingType ? modelBookingTypeToApiBookingType(bookingType) : null;
}

export async function getBookingTypes(): Promise<Array<ApiBookingTypeWithColor> | null> {
  const allBookingTypes = await model.getAllBookingTypes();
  return allBookingTypes !== null
    ? allBookingTypes
        .sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
        .map((b, index) => {
          return {
            ...modelBookingTypeToApiBookingType(b),
            color: BookingTypeColors[index % BookingTypeColors.length],
          };
        })
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
  flexibleLocation,
}: model.UpdateBookingTypeParams): Promise<ApiBookingType | null> {
  const bookingType = await model.updateBookingType({
    uuid,
    name,
    rules,
    exceptions,
    dateRanges,
    additionalInformation,
    flexibleLocation,
  });
  return bookingType !== null ? modelBookingTypeToApiBookingType(bookingType) : null;
}

export async function deleteBookingType(uuid: string) {
  return await model.deleteBookingType(uuid);
}

export function modelBookingTypeToApiBookingType(bookingType: model.BookingType): ApiBookingType {
  return {
    uuid: bookingType.uuid,
    name: bookingType.name,
    rules: bookingType.rules,
    exceptions: bookingType.exceptions,
    dateRanges: bookingType.dateRanges,
    additionalInformation: bookingType.additionalInformation,
    flexibleLocation: bookingType.flexibleLocation,
  };
}
