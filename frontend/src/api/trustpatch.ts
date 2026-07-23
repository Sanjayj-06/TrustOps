/**
 * api/trustpatch.ts
 * ------------------
 * API client layer for the TrustPatch backend.
 * Uses axios with base URL pointing to the FastAPI backend.
 *
 * All API calls are async and return typed responses.
 * Errors are normalized and re-thrown for UI handling.
 */

import axios from 'axios';
import type { UploadResponse, EvaluationResponse } from '../types';

// Base URL for the FastAPI backend
// Forcefully hardcode the live Render backend for production to bypass any incorrect Vercel settings
const BASE_URL = import.meta.env.PROD ? 'https://trustpatch-1.onrender.com' : 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes — trust evaluation takes time
  headers: {
    'Accept': 'application/json',
  },
});

/**
 * Upload a buggy Python file and its test file to create a session.
 *
 * @param buggyFile  - The buggy Python source file
 * @param testFile   - The unit test Python file
 * @returns UploadResponse with session_id
 */
export async function uploadFiles(
  buggyFile: File,
  testFile: File
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('buggy_file', buggyFile);
  formData.append('test_file', testFile);

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Run the full TrustPatch evaluation (BAPR + TAPR) for a session.
 *
 * This single endpoint runs both pipelines and returns a comprehensive
 * comparison including all 5 patches, metrics, explanations, and chart data.
 *
 * @param sessionId - Session UUID from uploadFiles()
 * @returns Full EvaluationResponse
 */
export async function evaluateTrustPatch(
  sessionId: string
): Promise<EvaluationResponse> {
  const response = await api.post<EvaluationResponse>(
    '/trustpatch/evaluate',
    { session_id: sessionId }
  );
  return response.data;
}

/**
 * Fetch history of past evaluation sessions.
 *
 * @param limit - Maximum number of sessions to return (default 20)
 */
export async function fetchHistory(limit = 20) {
  const response = await api.get(`/history?limit=${limit}`);
  return response.data;
}

/**
 * Health check — verify the backend is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch and increment the global visitor count.
 */
export async function getVisitorCount(): Promise<number> {
  const response = await api.get('/visitors');
  return response.data.visitors;
}

export default api;
