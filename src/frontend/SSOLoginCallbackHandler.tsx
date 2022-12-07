import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

import { useAuth } from './AuthContext';
import { useRequest } from './shared/http';
import { Redirect } from './Redirect';

export const SSOLoginCallbackHandler = () => {
  const { nonce } = useParams<{ nonce: string }>();
  const [done, setDone] = useState<boolean>(false);
  const { setToken } = useAuth();
  const { getRequest } = useRequest();

  useEffect(() => {
    const source = axios.CancelToken.source();
    const getToken = async (n: string) => {
      try {
        const result = await getRequest<{ data: { token: string; expiresAt: number } }>(
          `/api/auth/token/${n}`,
          {
            withCredentials: true,
            cancelToken: source.token,
          },
        );
        const { token, expiresAt } = result.data.data;
        setToken(token, expiresAt);
        setDone(true);
      } catch (err) {
        setDone(true);
      }
    };

    if (nonce) {
      getToken(nonce);
    }
    return () => source.cancel();
  }, [nonce, setToken, getRequest]);

  return done ? <Redirect to="/" /> : <div>Loggin in....</div>;
};
