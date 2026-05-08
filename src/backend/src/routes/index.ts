import { Router } from 'express';
import { uploadXlsx } from '../middleware/upload';
import { importFile, syncFromDir }  from '../controllers/importController';
import {
  getStats, listCompanies, getCompany,
  saveComplement, previewCompany, generateDocument, getDocuments,
} from '../controllers/companyController';
import { downloadDocument } from '../controllers/documentController';
import { exportCompaniesReport } from '../controllers/reportController';

const router = Router();

// ── Health ────────────────────────────────────────────────────────
router.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Dashboard ─────────────────────────────────────────────────────
router.get('/stats', getStats);

// ── Import ────────────────────────────────────────────────────────
router.post('/import/companies', uploadXlsx, importFile);
router.post('/import/sync',      syncFromDir);

// ── Companies ─────────────────────────────────────────────────────
router.get('/companies',                    listCompanies);
router.get('/companies/:id',                getCompany);
router.put('/companies/:id/complement',     saveComplement);
router.get('/companies/:id/preview',        previewCompany);
router.post('/companies/:id/generate-docx', generateDocument);
router.get('/companies/:id/documents',      getDocuments);

// ── Documents ─────────────────────────────────────────────────────
router.get('/documents/:id/download', downloadDocument);

// ── Reports ───────────────────────────────────────────────────────
router.post('/reports/companies/export', exportCompaniesReport);

export default router;
