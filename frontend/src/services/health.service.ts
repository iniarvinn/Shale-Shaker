import { http } from '#/api/client';
import type { BackendHealthResponse, BackendRootResponse } from '#/types/api/health';

export const healthService = {
  getHealth: () => http.get<BackendHealthResponse>('/health'),
  getRoot: () => http.get<BackendRootResponse>('/'),
};
