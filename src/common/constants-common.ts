export enum UserRole {
  volunteer = 'volunteer',
  staff = 'staff',
  unassigned = 'unassigned',
}

export interface TokenUserData {
  uuid: string;
  email: string;
  role: UserRole;
  fullName?: string;
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

export interface LetterAccessInfo {
  uuid: string;
  accessKey: string;
  accessPassword: string;
}

export interface SendLetterParams {
  uuid: string;
  accessKey: string;
  accessPassword: string;
  title: string;
  content: string;
}
