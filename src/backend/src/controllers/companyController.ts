import { Request, Response, NextFunction } from 'express';
import {
  findAll, findById, findComplement, upsertComplement,
  getDashboardStats, listDocuments, countAll,
  updateResponsavel, bulkUpdateResponsavel, updateInativo,
  type CompanyStatus,
} from '../repositories/companyRepository';
import { buildContratanteText } from '../services/textBuilderService';
import { generateDocx } from '../services/docxService';
import { safeFileName } from '../utils/formatters';
import { isValidCPF, isValidCNPJ, onlyDigits } from '../utils/validators';
import { AppError } from '../middleware/errorHandler';

// GET /api/stats
export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getDashboardStats());
  } catch (err) { next(err); }
}

// GET /api/companies
export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      search = '', status = 'all', page = '1', limit = '50',
    } = req.query as Record<string, string>;

    const pageNum   = Math.max(1, parseInt(page));
    const limitNum  = Math.min(200, Math.max(1, parseInt(limit)));
    const offset    = (pageNum - 1) * limitNum;
    const st        = status as CompanyStatus;
    // undefined = sem filtro | '__none__' = sem responsável | nome = filtrar pelo nome
    const responsavel = (req.query.responsavel as string | undefined) || undefined;

    const [companies, total] = await Promise.all([
      findAll({ search, status: st, limit: limitNum, offset, responsavel }),
      countAll({ search, status: st, responsavel }),
    ]);

    res.json({ data: companies, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (err) { next(err); }
}

// GET /api/companies/:id
export async function getCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const [complement, documents] = await Promise.all([
      findComplement(req.params.id),
      listDocuments(req.params.id),
    ]);

    res.json({ company, complement, documents });
  } catch (err) { next(err); }
}

// PUT /api/companies/:id/complement
export async function saveComplement(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const { nome_socio, cpf_socio } = req.body;
    if (!nome_socio?.trim()) throw new AppError(400, 'Nome do sócio é obrigatório.');
    if (!cpf_socio?.trim())  throw new AppError(400, 'CPF do sócio é obrigatório.');
    if (!isValidCPF(cpf_socio)) throw new AppError(400, 'CPF do sócio inválido.');
    if (!isValidCNPJ(onlyDigits(company.cnpj))) {
      throw new AppError(400, 'CNPJ da empresa inválido no banco de dados.');
    }

    const id = await upsertComplement(req.params.id, req.body);
    res.json({ id, message: 'Dados salvos com sucesso.' });
  } catch (err) { next(err); }
}

// GET /api/companies/:id/preview
export async function previewCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const complement = await findComplement(req.params.id);
    if (!complement) throw new AppError(422, 'Dados complementares não preenchidos. Preencha e salve primeiro.');

    res.json({
      texto_contratante: buildContratanteText(company, complement),
      nome_socio:        complement.nome_socio,
      razao_social:      company.razao_social,
      cnpj:              company.cnpj,
    });
  } catch (err) { next(err); }
}

// POST /api/companies/:id/generate-docx
// Gera o DOCX, salva em disco, registra no banco e retorna o arquivo para download imediato.
export async function generateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const complement = await findComplement(req.params.id);

    // Erros 400 amigáveis — exibidos diretamente no frontend
    if (!complement) {
      throw new AppError(400, 'Preencha e salve Nome Sócio e CPF Sócio antes de gerar o DOCX.');
    }
    if (!complement.nome_socio?.trim() || !complement.cpf_socio?.trim()) {
      throw new AppError(400, 'Preencha e salve Nome Sócio e CPF Sócio antes de gerar o DOCX.');
    }

    const fileName = safeFileName(company.razao_social, company.cnpj);
    const { buffer } = await generateDocx({ company, complement }, fileName);

    res.set({
      'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length':      String(buffer.length),
      // Impede que o interceptor de erro do axios tente parsear o blob como JSON
      'X-Document-Name':     fileName,
    });
    res.send(buffer);
  } catch (err) { next(err); }
}

// GET /api/companies/:id/documents
export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listDocuments(req.params.id));
  } catch (err) { next(err); }
}

// PATCH /api/companies/:id/responsavel
export async function patchResponsavel(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const { responsavel } = req.body as { responsavel?: unknown };
    const value =
      responsavel === null || responsavel === undefined
        ? null
        : String(responsavel).trim() || null;

    await updateResponsavel(req.params.id, value);
    res.json({ message: 'Responsável atualizado com sucesso.' });
  } catch (err) { next(err); }
}

// PATCH /api/companies/bulk/responsavel
export async function bulkPatchResponsavel(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, responsavel } = req.body as { ids?: unknown; responsavel?: unknown };

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(400, 'Informe ao menos uma empresa (ids[]).');
    }

    const safeIds = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (safeIds.length === 0) throw new AppError(400, 'IDs inválidos.');

    const value =
      responsavel === null || responsavel === undefined
        ? null
        : String(responsavel).trim() || null;

    const affected = await bulkUpdateResponsavel(safeIds, value);
    res.json({ message: `${affected} empresa(s) atualizada(s).`, affected });
  } catch (err) { next(err); }
}

// PATCH /api/companies/:id/status
export async function patchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const { inativo } = req.body as { inativo?: unknown };
    if (typeof inativo !== 'boolean') {
      throw new AppError(400, 'Campo inativo deve ser true ou false.');
    }

    await updateInativo(req.params.id, inativo);
    res.json({ message: `Empresa marcada como ${inativo ? 'inativa' : 'ativa'} com sucesso.` });
  } catch (err) { next(err); }
}
