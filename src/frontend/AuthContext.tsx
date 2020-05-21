import React, { useEffect, useState, useContext, useCallback } from 'react';

import type { TokenUserData } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';
import { BACKEND_URL, DISCOURSE_URL } from './constants-frontend';

interface IAuthContext {
  token: string | null;
  user: TokenUserData | null;
  logout: () => void;
  login: () => void;
  setToken: (token: string | null) => void;
}

export const AuthContext = React.createContext<IAuthContext>({
  token: null,
  user: null,
  logout: () => {},
  login: () => {},
  setToken: (t: string | null) => {},
});

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

export const AuthContextWrapper: React.FunctionComponent = ({ children }) => {
  const [user, setUser] = useState<TokenUserData | null>(getUserDataFromToken(localStorage.getItem('token')));
  const [token, setStateToken] = useState<string | null>(localStorage.getItem('token'));
  const { addNotification } = useNotifications();

  const setToken = useCallback((t: string | null) => {
    if (!t) {
      localStorage.removeItem('token');
    } else {
      localStorage.setItem('token', t);
    }
    setStateToken(t);
  }, []);

  function login() {
    setToken(null);
    setUser(null);
    window.location.replace(`${BACKEND_URL}/auth/sso`);
  }

  function logout() {
    setToken(null);
    setUser(null);
    addNotification({ type: 'success', message: 'Logged out', timestamp: Date.now() });
    // @ts-ignore
    window.location.replace(`${DISCOURSE_URL}`);
  }

  useEffect(() => {
    if (user) {
      addNotification({ type: 'success', message: `Welcome ${user.email}!`, timestamp: Date.now() });
    }
  }, [user]);

  useEffect(() => {
    const userData = getUserDataFromToken(token);
    if (!userData) {
      setToken(null);
      setUser(null);
    } else {
      setUser(userData);
    }
  }, [token, setToken]);

  return <AuthContext.Provider value={{ token, user, logout, login, setToken }}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  return useContext(AuthContext);
}
