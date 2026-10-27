import axios from 'axios';

import { toast } from '@/lib/toast-store';
import type { ApiSuccess } from '@/types/api';

import { describeApiError, toApiError } from './errors';

const DEFAULT_API_BASE_URL = 'http://localhost:4000/api/v1';
const REQUEST_TIMEOUT_MS = 15_000;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    const method = axios.isAxiosError(error) ? error.config?.method : undefined;

    // Failed reads render inline error states; failed writes are surfaced as toasts.
    if (method && method !== 'get') {
      toast.error(apiError.message, describeApiError(apiError));
    }

    return Promise.reject(apiError);
  },
);

export async function getData<TData>(url: string, params?: object): Promise<ApiSuccess<TData>> {
  const response = await apiClient.get<ApiSuccess<TData>>(url, { params });
  return response.data;
}

export async function postData<TData>(url: string, body: object): Promise<TData> {
  const response = await apiClient.post<ApiSuccess<TData>>(url, body);
  return response.data.data;
}
