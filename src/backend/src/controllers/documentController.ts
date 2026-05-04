import { Request, Response, NextFunction } from 'express';
import { findDocument } from '../repositories/companyRepository';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

// GET /api/documents/:id/download
export async function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await findDocument(req.params.id);
    if (!doc) throw new AppError(404, 'Documento não encontrado.');

    if (!fs.existsSync(doc.file_path)) {
      throw new AppError(404, 'Arquivo não encontrado no servidor. Pode ter sido excluído.');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(doc.file_path))}"`);
    res.setHeader('Content-Length', fs.statSync(doc.file_path).size);

    const stream = fs.createReadStream(doc.file_path);
    stream.pipe(res);
    stream.on('error', next);
  } catch (err) { next(err); }
}
