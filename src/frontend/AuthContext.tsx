import React, { useEffect, useState, useContext, useCallback } from 'react';

import axios from 'axios';
import type { TokenUserData } from '../common/constants-common';
import { useNotifications } from './NotificationsContext';

interface IAuthContext {
  token: string | null;
  tokenExpirationTime: number | null;
  user: TokenUserData | null;
  logout: () => void;
  login: () => void;
  setToken: (token: string | null, expirationTime: number | null) => void;
}

export const AuthContext = React.createContext<IAuthContext>({
  token: null,
  tokenExpirationTime: null,
  user: null,
  logout: () => {},
  login: () => {},
  setToken: (_: string | null, __: number | null) => {},
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
  const [user, setUser] = useState<TokenUserData | null>(
    getUserDataFromToken(sessionStorage.getItem('token')),
  );
  const [token, setStateToken] = useState<string | null>(sessionStorage.getItem('token'));
  const [tokenExpirationTime, setTokenExpirationTime] = useState<number | null>(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    sessionStorage.getItem('tokenExp') ? parseInt(sessionStorage.getItem('tokenExp')!) : null,
  );
  const { addNotification } = useNotifications();

  const setToken = useCallback((t: string | null, exp: number | null) => {
    if (!t || !exp) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('tokenExp');
      setStateToken(null);
      setTokenExpirationTime(null);
    } else {
      sessionStorage.setItem('token', t);
      sessionStorage.setItem('tokenExp', `${exp}`);
      setStateToken(t);
      setTokenExpirationTime(exp);
    }
  }, []);

  useEffect(() => {
    /* window.onbeforeunload = function () {
     *   setToken(null);
     *   setUser(null);
     *   // postRequest('api/auth/logout', {}, { useJwt: true });
     *   return null;
     * }; */
  }, [setToken, setUser]);
  function login() {
    setToken(null, null);
    setUser(null);
    window.location.replace('/api/auth/sso');
  }

  async function logout() {
    try {
      // Not using useRequest() here, since useRequest already relies on some AuthContext
      await axios.post(
        '/api/auth/logout',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            withCredentials: true,
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        },
      );
    } catch (err) {
      console.error(err);
    } finally {
      setToken(null, null);
      setUser(null);
      addNotification({ type: 'success', message: 'Logged out' });
      window.location.replace('/');
    }
  }

  useEffect(() => {
    if (user) {
      addNotification({ type: 'success', message: `Welcome ${user.email}!` });
    }
  }, [user, addNotification]);

  useEffect(() => {
    const userData = getUserDataFromToken(token);
    if (!userData) {
      setToken(null, null);
      setUser(null);
    } else {
      setUser(userData);
    }
  }, [token, setToken]);

  return (
    <AuthContext.Provider value={{ token, user, logout, login, setToken, tokenExpirationTime }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}
