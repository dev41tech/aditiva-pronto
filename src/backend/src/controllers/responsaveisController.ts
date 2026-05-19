import { Request, Response, NextFunction } from 'express';
import {
  listResponsaveis, createResponsavel,
  updateResponsavelNome, deleteResponsavel,
} from '../repositories/responsaveisRepository';
import { AppError } from '../middleware/errorHandler';

// GET /api/responsaveis
export async function getResponsaveis(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listResponsaveis());
  } catch (err) { next(err); }
}

// POST /api/responsaveis
export async function postResponsavel(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome } = req.body as { nome?: unknown };
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      throw new AppError(400, 'Nome é obrigatório.');
    }
    if (nome.trim().length > 100) {
      throw new AppError(400, 'Nome deve ter no máximo 100 caracteres.');
    }
    const id = await createResponsavel(nome.trim());
    res.status(201).json({ id, message: 'Responsável criado com sucesso.' });
  } catch (err: unknown) {
    // Erro de chave duplicada do MySQL
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      next(new AppError(409, 'Já existe um responsável com esse nome.'));
    } else {
      next(err);
    }
  }
}

// PATCH /api/responsaveis/:id
export async function patchResponsavelNome(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome } = req.body as { nome?: unknown };
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      throw new AppError(400, 'Nome é obrigatório.');
    }
    if (nome.trim().length > 100) {
      throw new AppError(400, 'Nome deve ter no máximo 100 caracteres.');
    }
    await updateResponsavelNome(req.params.id, nome.trim());
    res.json({ message: 'Responsável atualizado com sucesso.' });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      next(new AppError(409, 'Já existe um responsável com esse nome.'));
    } else {
      next(err);
    }
  }
}

// DELETE /api/responsaveis/:id
export async function removeResponsavel(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteResponsavel(req.params.id);
    res.json({ message: 'Responsável removido com sucesso.' });
  } catch (err) { next(err); }
}
