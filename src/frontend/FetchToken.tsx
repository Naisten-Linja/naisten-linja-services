import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { RouteComponentProps, Redirect } from '@reach/router';

import type { TokenUserData } from '../common/constants-common';
import { BACKEND_URL } from './constants-frontend';

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

export const FetchToken = (props: RouteComponentProps<{ nonce?: string }>) => {
  const { nonce } = props;
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useCallback(() => {
    async function getToken(nonce: string) {
      setIsFetching(true);
      try {
        const result = await axios.get(`${BACKEND_URL}/auth/token/${encodeURIComponent(nonce)}`, {
          withCredentials: true,
        });
        setIsFetching(false);
        const token = result.data.data.token as string;
        const userData = getUserDataFromToken(token);
        if (!userData) {
          setError('invalid user data');
        }
        // Store the token in localStorage
        window.localStorage.setItem('token', token);
      } catch (err) {
        console.log(err);
        setError('unable to login');
        setIsFetching(false);
        return null;
      }
    }

    if (nonce) {
      getToken(nonce);
    }
  }, [nonce]);

  return isFetching ? <div>Fetching token ....</div> : <Redirect noThrow to={error ? '/login' : '/'} />;
};
