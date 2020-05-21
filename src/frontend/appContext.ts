import React, { useContext } from 'react';
import axios from 'axios';
import { RouteComponentProps, Redirect } from '@reach/router';

import type { TokenUserData } from '../common/constants-common';
import { BACKEND_URL } from './constants-frontend';

interface Notification {
  type: 'error' | 'info' | 'warning';
  message: string;
}

interface IAuthContext {
  login: () => void;
  logout: () => void;
  updateToken: (token: string) => boolean;
  currentUser: TokenUserData | null;
}

const AuthContext = React.createContext<TokenUserData | null>(null);
const NotificationsContext = React.createContext<Array<Notification>>([]);

function validateUserData(userData: TokenUserData): boolean {
  let hasAllRequiredKeys = true;
  const dataKeys = Object.keys(userData);
  ['email', 'role', 'fullName', 'uuid'].forEach((requiredKey) => {
    if (dataKeys.indexOf(requiredKey) < 0) {
      hasAllRequiredKeys = false;
    }
  });
  return hasAllRequiredKeys;
}

function getUserDataFromToken(token: string | null): TokenUserData | null {
  if (!token) {
    return null;
  }
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    return null;
  }
  const userData = JSON.parse(atob(tokenParts[1])) as TokenUserData | null;
  if (!userData || !validateUserData(userData)) {
    return null;
  }
  return userData;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useNotifications() {
  // return useNotificationsContext(Nofitications);
}
