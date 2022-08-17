import { useCallback, useEffect, useRef } from 'react';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

import { useAuth } from './AuthContext';

interface RequestConfig extends AxiosRequestConfig {
  useJwt?: boolean;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
  accept: 'application/json',
  withCredentials: true,
};

export function useRequest() {
  const { token: _token, setToken, logout } = useAuth();

  // We want to always use the updated token when making requests,
  // but not recreate the getRequest/postRequest/... functions
  // each time the token changes, because that would
  // cause unnecessary reloads down the road.
  // So we store the token in a ref, which we can access from the
  // api helper functions with tokenRef.current. For those we must declare
  // the dependency as `tokenRef`, not `tokenRef.current`, that way the
  // reference stays the same even though the content can change.
  const tokenRef = useRef(_token);
  useEffect(() => {
    tokenRef.current = _token;
  }, [_token]);

  const handleError = useCallback(
    (err: unknown): void => {
      // @ts-ignore
      if (err && err.response?.status === 401) {
        logout();
        if (tokenRef.current) {
          setToken(null, null);
        }
      }
    },
    [logout, tokenRef, setToken],
  );

  const getRequest = useCallback(
    async function <T = unknown, R = AxiosResponse<T>>(
      apiPath: string,
      reqConfig: RequestConfig = {},
    ): Promise<R> {
      try {
        const { useJwt = false, headers = {}, ...config } = reqConfig;
        if (useJwt) {
          headers.Authorization = `Bearer ${tokenRef.current}`;
        }
        const result = await axios.get<T, R>(apiPath, {
          ...config,
          headers: {
            ...defaultHeaders,
            ...headers,
          },
        });
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [tokenRef, handleError],
  );

  const putRequest = useCallback(
    async function <T = unknown, R = AxiosResponse<T>>(
      apiPath: string,
      data?: Record<string, unknown>,
      reqConfig?: RequestConfig,
    ): Promise<R> {
      try {
        const { useJwt = false, headers = {}, ...config } = reqConfig || {};
        if (useJwt) {
          headers.Authorization = `Bearer ${tokenRef.current}`;
        }
        return axios.put<T, R>(apiPath, data, {
          ...config,
          headers: {
            ...defaultHeaders,
            ...headers,
          },
        });
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [tokenRef, handleError],
  );

  const postRequest = useCallback(
    async function <T = unknown, R = AxiosResponse<T>>(
      apiPath: string,
      data?: unknown,
      reqConfig?: RequestConfig,
    ): Promise<R> {
      try {
        const { useJwt = false, headers = {}, ...config } = reqConfig || {};
        if (useJwt) {
          headers.Authorization = `Bearer ${tokenRef.current}`;
        }
        const result = await axios.post<T, R>(apiPath, data, {
          ...config,
          headers: {
            ...defaultHeaders,
            ...headers,
          },
        });
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [tokenRef, handleError],
  );

  const deleteRequest = useCallback(
    async function <T = unknown, R = AxiosResponse<T>>(
      apiPath: string,
      reqConfig?: RequestConfig,
    ): Promise<R> {
      try {
        const { useJwt = false, headers = {}, ...config } = reqConfig || {};
        if (useJwt) {
          headers.Authorization = `Bearer ${tokenRef.current}`;
        }
        const result = await axios.delete<T, R>(apiPath, {
          ...config,
          headers: {
            ...defaultHeaders,
            ...headers,
          },
        });
        return result;
      } catch (err) {
        handleError(err);
        throw err;
      }
    },
    [tokenRef, handleError],
  );

  return { getRequest, putRequest, postRequest, deleteRequest };
}
