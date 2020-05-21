import { ApiUserData } from '../../common/constants-common';
import { getUsers, getUserByUuid, updateUserRole } from '../models/user';

import { User } from '../models/user';

export async function getApiUsers(): Promise<Array<ApiUserData>> {
  const dbUsers = await getUsers();
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
    };
  });
  return users;
}

export async function updateApiUserRole({
  uuid,
  role,
}: {
  uuid: User['uuid'];
  role: User['role'];
}): Promise<User | null> {
  const user = await getUserByUuid(uuid);
  if (!user) {
    return null;
  }
  const result = await updateUserRole({ uuid, role });
  if (result) {
    return result;
  }
  return null;
}
