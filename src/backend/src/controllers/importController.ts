import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { importFromBuffer, importFromPath } from '../services/importService';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// POST /api/import/companies  (multipart/form-data — campo "file")
export async function importFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, 'Arquivo não enviado. Use o campo "file" (multipart/form-data).');

    logger.info(`[import/upload] recebido: "${req.file.originalname}" (${req.file.size} bytes)`);
    const result = await importFromBuffer(req.file.buffer, req.file.originalname);
    res.json(result);
  } catch (err) { next(err); }
}

// POST /api/import/sync — sincroniza a partir do diretório configurado
export async function syncFromDir(_req: Request, res: Response, next: NextFunction) {
  const importFolder = process.env.IMPORT_FOLDER;

  // ── 1. Verificar variável de ambiente ──────────────────────────
  logger.info(`[import/sync] IMPORT_FOLDER configurado: "${importFolder ?? '(não definido)'}"`);

  if (!importFolder || importFolder.trim() === '') {
    return next(new AppError(
      400,
      'Variável de ambiente IMPORT_FOLDER não está definida. ' +
      'Configure-a no EasyPanel apontando para a pasta de importação (ex: /app/imports).',
    ));
  }

  const dir = importFolder.trim();

  // ── 2. Verificar se a pasta existe ────────────────────────────
  logger.info(`[import/sync] verificando existência da pasta: "${dir}"`);

  if (!fs.existsSync(dir)) {
    logger.warn(`[import/sync] pasta não encontrada: "${dir}"`);
    return next(new AppError(
      400,
      `Pasta de importação não encontrada: "${dir}". ` +
      'Verifique se o volume está montado corretamente no EasyPanel.',
    ));
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(dir);
  } catch (e) {
    logger.error(`[import/sync] erro ao acessar pasta: "${dir}"`, { error: e });
    return next(new AppError(500, `Não foi possível acessar a pasta "${dir}": ${(e as Error).message}`));
  }

  if (!stat.isDirectory()) {
    return next(new AppError(400, `O caminho "${dir}" não é uma pasta.`));
  }

  // ── 3. Listar arquivos suportados ─────────────────────────────
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch (e) {
    logger.error(`[import/sync] erro ao listar pasta: "${dir}"`, { error: e });
    return next(new AppError(500, `Erro ao listar conteúdo de "${dir}": ${(e as Error).message}`));
  }

  logger.info(`[import/sync] total de entradas na pasta: ${entries.length}`);

  const files = entries
    .filter((f) => /\.(xlsx|xls|csv)$/i.test(f))
    .map((f) => {
      const fullPath = path.join(dir, f);
      const mtime = fs.statSync(fullPath).mtimeMs;
      return { name: f, fullPath, mtime };
    })
    .sort((a, b) => b.mtime - a.mtime); // mais recente primeiro

  logger.info(
    `[import/sync] arquivos encontrados (${files.length}): ${files.map((f) => f.name).join(', ') || '(nenhum)'}`,
  );

  if (files.length === 0) {
    return next(new AppError(
      400,
      `Nenhum arquivo .xlsx, .xls ou .csv encontrado em "${dir}". ` +
      'Faça upload do relatório exportado do Domínio Registro para essa pasta.',
    ));
  }

  // ── 4. Importar o arquivo mais recente ────────────────────────
  const latest = files[0];
  logger.info(`[import/sync] importando arquivo mais recente: "${latest.name}"`);

  try {
    const result = await importFromPath(latest.fullPath);

    logger.info(
      `[import/sync] concluído — inseridos:${result.inserted} atualizados:${result.updated} pulados:${result.skipped}`,
    );

    return res.json({
      inserted:   result.inserted,
      updated:    result.updated,
      skipped:    result.skipped,
      total:      result.total,
      errors:     result.errors,
      sourceFile: latest.name,
      message:    `Sincronização concluída. Arquivo: "${latest.name}". ` +
                  `Inseridas: ${result.inserted} | Atualizadas: ${result.updated} | Ignoradas: ${result.skipped}.`,
    });
  } catch (err) {
    const e = err as Error;
    logger.error(`[import/sync] erro ao importar "${latest.name}"`, { error: e.message, stack: e.stack });
    return next(err);
  }
}
