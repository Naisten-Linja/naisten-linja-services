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
  const { token, setToken } = useAuth();

  const getRequest = useCallback(
    async function <T = any, R = AxiosResponse<T>>(
      apiPath: string,
      reqConfig?: RequestConfig,
    ): Promise<R> {
      try {
        const { useJwt = false, headers = {}, ...config } = reqConfig || {};
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
        if (err.response && err.response.data.error === 'invalid jwt token') {
          setToken(null);
        }
        throw err;
      }
    },
    [token, setToken],
  );

  const putRequest = useCallback(
    async function <T = any, R = AxiosResponse<T>>(
      apiPath: string,
      data?: Record<string, any>,
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
        if (err.response && err.response.data.error === 'invalid jwt token') {
          setToken(null);
        }
        throw err;
      }
    },
    [token, setToken],
  );

  const postRequest = useCallback(
    async function <T = any, R = AxiosResponse<T>>(
      apiPath: string,
      data?: any,
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
        if (err.response && err.response.data.error === 'invalid jwt token') {
          setToken(null);
        }
        throw err;
      }
    },
    [token, setToken],
  );

  return { getRequest, putRequest, postRequest };
}
