import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RouteComponentProps, Redirect } from '@reach/router';

import { useAuth } from './AuthContext';
import { useRequest } from './shared/http';

export const SSOLoginCallbackHandler = (props: RouteComponentProps<{ nonce?: string }>) => {
  const { nonce } = props;
  const [done, setDone] = useState<boolean>(false);
  const { setToken } = useAuth();
  const { getRequest } = useRequest();

  useEffect(() => {
    const source = axios.CancelToken.source();
    const getToken = async (nonce: string) => {
      try {
        const result = await getRequest<{ data: { token: string; expiresAt: number } }>(
          `/api/auth/token/${nonce}`,
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

  return done ? <Redirect noThrow to="/" /> : <div>Loggin in....</div>;
};