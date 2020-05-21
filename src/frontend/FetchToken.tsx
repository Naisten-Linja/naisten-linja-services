import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RouteComponentProps, Redirect } from '@reach/router';

import { BACKEND_URL } from './constants-frontend';
import { useAuth } from './AuthContext';

export const FetchToken = (props: RouteComponentProps<{ nonce?: string }>) => {
  const { nonce } = props;
  const [done, setDone] = useState<boolean>(false);
  const { setToken } = useAuth();

  useEffect(() => {
    const source = axios.CancelToken.source();
    const getToken = async (nonce: string) => {
      try {
        const result = await axios.get(`${BACKEND_URL}/auth/token/${nonce}`, {
          withCredentials: true,
          cancelToken: source.token,
        });
        const token = result.data.data.token as string;
        setToken(token);
        setDone(true);
      } catch (err) {
        setToken(null);
        setDone(true);
      }
    };

    if (nonce) {
      getToken(nonce);
    }
    return () => source.cancel();
  }, [nonce, setToken]);

  return done ? <Redirect noThrow to="/" /> : <div>Fetching token ....</div>;
};
