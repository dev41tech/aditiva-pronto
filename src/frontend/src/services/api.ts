import axios, { AxiosError } from 'axios';
import type {
  Company, Complement, GeneratedDocument,
  DashboardStats, ListResponse, PreviewResponse, CompanyStatus,
} from '../types';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 60_000,
});

// Extrai a mensagem real do JSON de erro da API, em vez de "Request failed with status 500"
http.interceptors.response.use(
  (r) => r,
  (err: AxiosError<{ error?: string; detail?: string }>) => {
    const apiMessage =
      err.response?.data?.error ||
      err.response?.data?.detail ||
      err.message;
    const enhanced = new Error(apiMessage);
    return Promise.reject(enhanced);
  },
);

// ── Health ──────────────────────────────────────────────────────
export const getHealth = () => http.get<{ status: string }>('/health').then(r => r.data);

// ── Dashboard ───────────────────────────────────────────────────
export const getStats = () => http.get<DashboardStats>('/stats').then(r => r.data);

// ── Import ──────────────────────────────────────────────────────
export function importFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  return http.post('/import/companies', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
}

export const syncFromDir = () => http.post('/import/sync').then(r => r.data);

// ── Companies ───────────────────────────────────────────────────
export function listCompanies(params: {
  search?: string;
  status?: CompanyStatus;
  page?:   number;
  limit?:  number;
}) {
  return http.get<ListResponse>('/companies', { params }).then(r => r.data);
}

export function getCompany(id: string) {
  return http.get<{
    company:    Company;
    complement: Complement | null;
    documents:  GeneratedDocument[];
  }>(`/companies/${id}`).then(r => r.data);
}

export function saveComplement(id: string, data: Complement) {
  return http.put<{ id: string; message: string }>(`/companies/${id}/complement`, data).then(r => r.data);
}

export function getPreview(id: string) {
  return http.get<PreviewResponse>(`/companies/${id}/preview`).then(r => r.data);
}

export function generateDocx(id: string) {
  return http.post<{ fileName: string; filePath: string; message: string }>(
    `/companies/${id}/generate-docx`,
  ).then(r => r.data);
}

export function getDocuments(id: string) {
  return http.get<GeneratedDocument[]>(`/companies/${id}/documents`).then(r => r.data);
}

export function downloadUrl(docId: string) {
  return `${http.defaults.baseURL}/documents/${docId}/download`;
}
