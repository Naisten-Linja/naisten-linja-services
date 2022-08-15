export enum UserRole {
  volunteer = 'volunteer',
  staff = 'staff',
  unassigned = 'unassigned',
}

export interface TokenUserData {
  uuid: string;
  email: string;
  role: UserRole;
  fullName: string | null;
  iat: number;
  exp: number;
}

export interface ApiUserData {
  uuid: string;
  email: string;
  role: UserRole;
  fullName: string | null;
  created: string;
  newBookingNotificationDaysThreshold?: number | null;
  userNote: string;
}

export enum LetterStatus {
  pending = 'pending',
  sent = 'sent',
}

export interface ApiLetterCredentials {
  accessKey: string;
  accessPassword: string;
}

export interface ApiLetterAdmin {
  uuid: string;
  title: string | null;
  content: string | null;
  status: LetterStatus;
  replyStatus: ReplyStatus | null;
  created: string;
  assignedResponderUuid: string | null;
  assignedResponderEmail: string | null;
  assignedResponderFullName: string | null;
}

export interface ApiLetterContent {
  title: string;
  content: string;
  created: string;
  replyContent: string | null;
  replyUpdated: string | null;
}

export interface ApiSendLetterParams {
  accessKey: string;
  accessPassword: string;
  title: string;
  content: string;
}

export enum ResponderType {
  internal = 'internal',
  sender = 'sender',
}

export enum ReplyStatus {
  draft = 'draft',
  in_review = 'in_review',
  published = 'published',
}

export enum ReadReceiptStatus {
  unread = 'unread',
  read = 'read',
}

export interface ApiReplyParamsAdmin {
  letterUuid: string;
  content: string;
  status: ReplyStatus;
}

export interface ApiReplyAdmin {
  uuid: string;
  letterUuid: string;
  internalAuthorUuid: string | null;
  status: ReplyStatus;
  authorType: ResponderType;
  content: string;
  created: string;
  updated: string;
  readReceipt: ReadReceiptStatus;
  readTimestamp: string | null;
}

export interface ApiLetterWithReadStatus extends ApiLetterAdmin {
  replyReadReceipt: ReadReceiptStatus | null;
  replyReadTimestamp: string | null;
}

export const weekDays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export interface BookingSlot {
  start: string;
  end: string;
  seats: number;
}

export interface SlotBookingRules {
  enabled: boolean;
  slots: Array<BookingSlot>;
}

export type BookingTypeDailyRules = [
  SlotBookingRules,
  SlotBookingRules,
  SlotBookingRules,
  SlotBookingRules,
  SlotBookingRules,
  SlotBookingRules,
  SlotBookingRules,
];

export interface ApiBookingType {
  uuid: string;
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  additionalInformation: string | null;
}

export interface ApiBookingTypeParamsAdmin {
  name: string;
  rules: BookingTypeDailyRules;
  exceptions: Array<string>;
  additionalInformation: string | null;
}

export interface ApiCreateBookingParams {
  email: string;
  phone: string;
  fullName: string;
  bookingTypeUuid: string;
  userUuid: string;
  start: string;
  end: string;
  bookingNote: string;
  workingRemotely: boolean;
}

export interface ApiBooking {
  uuid: string;
  email: string;
  phone: string;
  fullName: string;
  user: ApiUserData;
  bookingType: ApiBookingType;
  bookingNote: string;
  workingRemotely: boolean;
  // These are stored separatedly in order to retain past booking information in cased the bookingType is deleted,
  // or slot timing changed.
  start: string;
  end: string;
}

export interface ApiUpdateBookingParams {
  email: string;
  fullName: string;
  phone: string;
  bookingNote: string;
}

export interface ApiBookingUserStats {
  uuid: string;
  previousBooking: ApiBooking | null;
  upcomingBooking: ApiBooking | null;
  totalPrevious: number;
  totalUpcoming: number;
}

export interface ApiBookedSlot {
  bookingTypeUuid: string;
  start: string;
  end: string;
  count: number;
}

export interface ApiPage {
  uuid: string;
  slug: string;
  title: string;
  content: string;
}

export interface ApiUpdateUserSettingsParams {
  newBookingNotificationDaysThreshold: number | null;
}

export type ApiUpdatePageParams = Omit<ApiPage, 'uuid'>;
