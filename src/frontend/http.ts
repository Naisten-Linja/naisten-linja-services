import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

import { BACKEND_URL } from './constants-frontend';
import { useAuth } from './AuthContext';

interface RequestConfig extends AxiosRequestConfig {
  useJwt?: boolean;
}

export function useRequest() {
  const { token } = useAuth();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    accept: 'application/json',
    withCredentials: true,
  };

  function getRequest<T = any, R = AxiosResponse<T>>(
    url: string,
    reqConfig?: RequestConfig,
  ): Promise<R> {
    const { useJwt = false, headers = {}, ...config } = reqConfig || {};
    if (useJwt) {
      headers.Authorization = `Bearer ${token}`;
    }
    return axios.get<T, R>(`${BACKEND_URL}${url}`, {
      ...config,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
  }

  function putRequest<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: Record<string, any>,
    reqConfig?: RequestConfig,
  ): Promise<R> {
    const { useJwt = false, headers = {}, ...config } = reqConfig || {};
    if (useJwt) {
      headers.Authorization = `Bearer ${token}`;
    }
    return axios.put<T, R>(`${BACKEND_URL}${url}`, data, {
      ...config,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
  }

  function postRequest<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    reqConfig?: RequestConfig,
  ): Promise<R> {
    const { useJwt = false, headers = {}, ...config } = reqConfig || {};
    if (useJwt) {
      headers.Authorization = `Bearer ${token}`;
    }
    return axios.post<T, R>(`${BACKEND_URL}${url}`, data, {
      ...config,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
  }

  return { getRequest, putRequest, postRequest };
}
