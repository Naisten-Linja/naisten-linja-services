export const HOUR_CELL_HEIGHT = 3;

export type BookingSlotDetails = {
  bookingTypeName: string;
  bookingTypeAdditionalInformation: string;
  bookingTypeUuid: string;
  // The start and end time will be stored separately so past booking items are not affected, in case the bookingType is
  // deleted or modified in the future.
  // TODO: `start` and `end` time should still be validated to match the bookingType slot specification from the backend
  // in the unlikely case a volunteer sends a custom request for a random booking time.
  start: moment.Moment;
  end: moment.Moment;
  seats: number;
  availableSeats: number;
};
