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
import type {
  UploadResponse,
  EvaluationResponse,
  SessionExplanationResponse,
  DecisionRequest,
  DecisionResponse,
  KnowledgeSummary,
  KnowledgeBaseListResponse,
  KnowledgeBaseEntry,
} from '../types';

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

// =============================================================
// TrustOps Phase 1 API Functions
// =============================================================

/**
 * Get structured trust explanations for all patches in a session.
 * Calls GET /trustops/explanation/{session_id}
 */
export async function getSessionExplanation(
  sessionId: string
): Promise<SessionExplanationResponse> {
  const response = await api.get<SessionExplanationResponse>(
    `/trustops/explanation/${sessionId}`
  );
  return response.data;
}

/**
 * Submit a human decision (Accept / Reject / Override) for a patch.
 * Calls POST /trustops/decision/submit
 */
export const submitDecision = async (request: DecisionRequest): Promise<DecisionResponse> => {
  const resp = await api.post('/trustops/decision/submit', request);
  return resp.data;
};

// ----------------------------------------------------
// PHASE 2: RUNTIME MONITORING ENDPOINTS
// ----------------------------------------------------

export const startRuntimeSession = async (sessionId: string, patchId: string) => {
  const resp = await api.post('/trustops/runtime/start', {
    session_id: sessionId,
    patch_id: patchId,
  });
  return resp.data;
};

export const simulateRuntimeTick = async (sessionId: string) => {
  const resp = await api.post('/trustops/runtime/simulate', {
    session_id: sessionId,
  });
  return resp.data;
};

export const getRuntimeMetrics = async (sessionId: string) => {
  const resp = await api.get(`/trustops/runtime/${sessionId}`);
  return resp.data;
};

export const getRuntimeHistory = async (sessionId: string) => {
  const resp = await api.get(`/trustops/runtime/history/${sessionId}`);
  return resp.data;
};

export const getRuntimeHealth = async (sessionId: string) => {
  const resp = await api.get(`/trustops/runtime/health/${sessionId}`);
  return resp.data;
};

/**
 * Retrieve aggregate statistics from the Trust Knowledge Base.
 * Calls GET /trustops/knowledge/summary
 */
export async function getKnowledgeSummary(): Promise<KnowledgeSummary> {
  const response = await api.get<KnowledgeSummary>('/trustops/knowledge/summary');
  return response.data;
}

export async function getKnowledgeEntries(limit = 50): Promise<KnowledgeBaseListResponse> {
  const response = await api.get<KnowledgeBaseListResponse>(`/trustops/knowledge/entries?limit=${limit}`);
  return response.data;
}

export async function getKnowledgeEntry(entryId: number): Promise<KnowledgeBaseEntry & { explanation: any; weights: any }> {
  const response = await api.get<KnowledgeBaseEntry & { explanation: any; weights: any }>(`/trustops/knowledge/entries/${entryId}`);
  return response.data;
}

export default api;
