export enum UserRole {
  volunteer = 'volunteer',
  staff = 'staff',
}

export interface TokenUserData {
  email: string;
  role: UserRole;
  fullName?: string;
  uuid: string;
}
