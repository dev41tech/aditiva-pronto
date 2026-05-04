import { Request, Response, NextFunction } from 'express';
import { importFromBuffer, importFromPath } from '../services/importService';
import { AppError } from '../middleware/errorHandler';
import path from 'path';

// POST /api/import/companies  (multipart/form-data — campo "file")
export async function importFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, 'Arquivo não enviado. Use o campo "file" (multipart/form-data).');

    const result = await importFromBuffer(req.file.buffer, req.file.originalname);
    res.json(result);
  } catch (err) { next(err); }
}

// POST /api/import/sync  — sincroniza a partir do diretório configurado
export async function syncFromDir(req: Request, res: Response, next: NextFunction) {
  try {
    const exportsDir = process.env.EXPORTS_DIR;
    if (!exportsDir) throw new AppError(500, 'EXPORTS_DIR não configurado no .env');

    const fs   = await import('fs');
    const dir  = exportsDir;

    if (!fs.existsSync(dir)) {
      throw new AppError(404, `Diretório não encontrado: "${dir}"`);
    }

    const files = fs.readdirSync(dir)
      .filter((f) => /\.(xlsx|xls)$/i.test(f))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime); // mais recente primeiro

    if (files.length === 0) {
      throw new AppError(404, `Nenhum arquivo Excel encontrado em "${dir}"`);
    }

    // Importa o arquivo mais recente
    const latest = files[0];
    const result = await importFromPath(path.join(dir, latest.name));

    res.json({ ...result, syncedFile: latest.name });
  } catch (err) { next(err); }
}
