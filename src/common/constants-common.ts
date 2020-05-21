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
