export enum UserRole {
  volunteer = 'volunteer',
  staff = 'staff',
}

export interface TokenUserData {
  uuid: string;
  email: string;
  role: UserRole;
  fullName?: string;
  iat: number;
  exp: number;
}
