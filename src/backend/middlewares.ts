import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../common/constants-common';

export const isAuthenticated =
  (roles: Array<UserRole> = []) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { user } = req;
    if (!user || (roles.length > 0 && !roles.includes(user.role))) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    return next();
  };
