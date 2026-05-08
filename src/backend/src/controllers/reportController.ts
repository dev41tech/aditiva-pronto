import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';
import {
  exportCompanies,
  ALLOWED_FIELDS,
  type ExportFormat,
  type ExportStatus,
} from '../services/reportService';

const VALID_FORMATS:  ExportFormat[] = ['xlsx', 'csv'];
const VALID_STATUSES: ExportStatus[] = ['all', 'pending', 'ready'];

// POST /api/reports/companies/export
export async function exportCompaniesReport(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { format, status = 'all', search = '', fields } = req.body as {
      format?:  unknown;
      status?:  unknown;
      search?:  unknown;
      fields?:  unknown;
    };

    // ── Validação do payload ──────────────────────────────────────
    if (!format || !VALID_FORMATS.includes(format as ExportFormat)) {
      throw new AppError(400, `Formato inválido. Use: ${VALID_FORMATS.join(' ou ')}.`);
    }

    if (!VALID_STATUSES.includes(status as ExportStatus)) {
      throw new AppError(400, `Status inválido. Use: ${VALID_STATUSES.join(', ')}.`);
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      throw new AppError(400, 'Selecione ao menos um campo para exportar.');
    }

    // Filtra campos fora da whitelist silenciosamente
    const safeFields = (fields as unknown[])
      .filter((f): f is string => typeof f === 'string')
      .filter((f) => (ALLOWED_FIELDS as readonly string[]).includes(f));

    if (safeFields.length === 0) {
      throw new AppError(400, 'Nenhum campo válido selecionado para exportação.');
    }

    if (typeof search !== 'string' && search !== undefined) {
      throw new AppError(400, 'Campo search deve ser uma string.');
    }

    // ── Geração do arquivo ────────────────────────────────────────
    const { buffer, fileName, contentType } = await exportCompanies({
      format:  format as ExportFormat,
      status:  status as ExportStatus,
      search:  typeof search === 'string' ? search : '',
      fields:  safeFields,
    });

    res.set({
      'Content-Type':        contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length':      String(buffer.length),
    });

    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
