import { useCallback } from 'react';
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
  const { token, setToken, logout } = useAuth();

  const handleError = useCallback(
    (err: unknown): void => {
      // @ts-ignore
      if (err && err.response?.status === 401) {
        logout();
        if (token) {
          setToken(null, null);
        }
      }
    },
    [logout, token, setToken],
  );

  const getRequest = useCallback(
    async function <T = unknown, R = AxiosResponse<T>>(
      apiPath: string,
      reqConfig: RequestConfig = {},
    ): Promise<R> {
      try {
        const { useJwt = false, headers = {}, ...config } = reqConfig;
        if (useJwt) {
          headers.Authorization = `Bearer ${token}`;
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
    [token, handleError],
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
          headers.Authorization = `Bearer ${token}`;
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
    [token, handleError],
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
          headers.Authorization = `Bearer ${token}`;
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
    [token, handleError],
  );

  const deleteRequest = useCallback(
    async function <T = unknown, R = AxiosResponse<T>>(
      apiPath: string,
      reqConfig?: RequestConfig,
    ): Promise<R> {
      try {
        const { useJwt = false, headers = {}, ...config } = reqConfig || {};
        if (useJwt) {
          headers.Authorization = `Bearer ${token}`;
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
    [token, handleError],
  );

  return { getRequest, putRequest, postRequest, deleteRequest };
}
