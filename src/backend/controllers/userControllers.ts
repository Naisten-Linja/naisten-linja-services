import { ApiUserData, ApiUpdateUserSettingsParams } from '../../common/constants-common';
import * as userModel from '../models/users';

export async function getApiUsers(): Promise<Array<ApiUserData>> {
  const dbUsers = await userModel.getUsers();
  if (!dbUsers) {
    return [];
  }
  const users = dbUsers.map(modelUserToApiUserData);
  return users;
}

export async function updateApiUserRole({
  uuid,
  role,
}: {
  uuid: userModel.User['uuid'];
  role: userModel.User['role'];
}): Promise<userModel.User | null> {
  const user = await userModel.getUserByUuid(uuid);
  if (!user) {
    return null;
  }
  const result = await userModel.updateUserRole({ uuid, role });
  if (result) {
    return result;
  }
  return null;
}

export async function updateUserSettings({
  uuid,
  newBookingNotificationDaysThreshold,
}: ApiUpdateUserSettingsParams & {
  uuid: string;
}): Promise<userModel.User | null> {
  const threshold =
    newBookingNotificationDaysThreshold && newBookingNotificationDaysThreshold > 0
      ? newBookingNotificationDaysThreshold
      : null;
  const result = await userModel.updateUserSettings({
    uuid,
    newBookingNotificationDaysThreshold: threshold,
  });
  if (!result) {
    return null;
  }
  return result;
}

export async function updateApiUserNote({
  uuid,
  userNote,
}: {
  uuid: userModel.User['uuid'];
  userNote: userModel.User['userNote'];
}): Promise<userModel.User | null> {
  const user = await userModel.getUserByUuid(uuid);
  if (!user) {
    return null;
  }
  const result = await userModel.updateUserNote({ uuid, userNote });
  if (result) {
    return result;
  }
  return null;
}

export async function getUserData(uuid: string): Promise<ApiUserData | null> {
  const user = await userModel.getUserByUuid(uuid);
  if (!user) {
    return null;
  }
  return modelUserToApiUserData(user);
}

export function modelUserToApiUserData(user: userModel.User): ApiUserData {
  const { email, uuid, role, fullName, created, userNote, newBookingNotificationDaysThreshold } =
    user;
  return {
    email,
    uuid,
    role,
    fullName,
    created,
    userNote,
    newBookingNotificationDaysThreshold,
  };
}
