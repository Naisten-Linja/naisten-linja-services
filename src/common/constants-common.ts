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
}

export type WeekDays =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

interface SlotBookingRules {
  disabled: false;
  fullDay: false;
  slots: Array<{
    start: string;
    end: string;
    seats: number;
  }>;
}

interface FullDayBookingRules {
  disabled: false;
  fullDay: true;
  seats: number;
}

type DisabledDayRules =
  | { disabled: true }
  | {
      disabled: true;
      fullDay: true;
      seats: number;
    }
  | {
      disabled: true;
      fullDay: false;
      slots: SlotBookingRules['slots'];
    };

export type BookingTypeRules = Record<
  WeekDays,
  SlotBookingRules | FullDayBookingRules | DisabledDayRules
>;

export interface BookingTypeExceptions {
  [date: string]: SlotBookingRules | FullDayBookingRules;
}

export interface ApiBookingType {
  uuid: string;
  name: string;
  rules: BookingTypeRules;
  exceptions: BookingTypeExceptions;
}

export interface ApiBooking {
  bookingType: ApiBookingType;
  email: string;
  name: string;
  phone: string;
  user: ApiUserData;
  uuid: string;
}
