// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace Express {
  export type UserRole = import('../common/constants-common').UserRole;

  export interface User<R extends UserRole = UserRole> {
    name: string;
    role: R;
    uuid: string;
    email: string;
    fullName: string;
  }

  export interface Request {
    user?: User;
  }
}
