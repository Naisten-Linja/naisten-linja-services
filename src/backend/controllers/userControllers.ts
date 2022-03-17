import { ApiUserData, ApiUpdateUserSettingsParams } from '../../common/constants-common';
import * as userModel from '../models/users';

export async function getApiUsers(): Promise<Array<ApiUserData>> {
  const dbUsers = await userModel.getUsers();
  if (!dbUsers) {
    return [];
  }
  const users = dbUsers.map((user) => {
    return {
      uuid: user.uuid,
      email: user.email,
      fullName: user.fullName,
      created: user.created,
      role: user.role,
      newBookingNotificationDaysThreshold: user.newBookingNotificationDaysThreshold,
    };
  });
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

export async function getUserData(uuid: string): Promise<ApiUserData | null> {
  const user = await userModel.getUserByUuid(uuid);
  if (!user) {
    return null;
  }
  return {
    uuid: user.uuid,
    email: user.email,
    fullName: user.fullName,
    created: user.created,
    role: user.role,
    newBookingNotificationDaysThreshold: user.newBookingNotificationDaysThreshold,
  };
}
