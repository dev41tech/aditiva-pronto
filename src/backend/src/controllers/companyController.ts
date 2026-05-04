import { Request, Response, NextFunction } from 'express';
import {
  findAll, findById, findComplement, upsertComplement,
  getDashboardStats, listDocuments,
} from '../repositories/companyRepository';
import { buildContratanteText } from '../services/textBuilderService';
import { generateDocx } from '../services/docxService';
import { safeFileName } from '../utils/formatters';
import { isValidCPF, isValidCNPJ, onlyDigits } from '../utils/validators';
import { AppError } from '../middleware/errorHandler';

// GET /api/stats
export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) { next(err); }
}

// GET /api/companies
export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const { search = '', status = 'all', page = '1', limit = '50' } = req.query as Record<string, string>;
    const pageNum   = Math.max(1, parseInt(page));
    const limitNum  = Math.min(200, Math.max(1, parseInt(limit)));
    const offset    = (pageNum - 1) * limitNum;

    const [companies, total] = await Promise.all([
      findAll({ search, status: status as 'all' | 'pending' | 'ready', limit: limitNum, offset }),
      import('../repositories/companyRepository').then(r => r.countAll({ search, status: status as 'all' | 'pending' | 'ready' })),
    ]);

    res.json({
      data:  companies,
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) { next(err); }
}

// GET /api/companies/:id
export async function getCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const complement = await findComplement(req.params.id);
    const documents  = await listDocuments(req.params.id);

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

    // Valida CNPJ da empresa (já vem do banco, mas garante formato)
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
    const company    = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const complement = await findComplement(req.params.id);
    if (!complement) throw new AppError(422, 'Dados complementares não preenchidos. Preencha e salve primeiro.');

    const texto = buildContratanteText(company, complement);
    res.json({
      texto_contratante: texto,
      nome_socio:        complement.nome_socio,
      razao_social:      company.razao_social,
      cnpj:              company.cnpj,
    });
  } catch (err) { next(err); }
}

// POST /api/companies/:id/generate-docx
export async function generateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const company    = await findById(req.params.id);
    if (!company) throw new AppError(404, 'Empresa não encontrada.');

    const complement = await findComplement(req.params.id);
    if (!complement) throw new AppError(422, 'Dados complementares não preenchidos.');
    if (!complement.nome_socio || !complement.cpf_socio) {
      throw new AppError(422, 'Nome do sócio e CPF são obrigatórios para gerar o documento.');
    }

    const fileName = safeFileName(company.razao_social, company.cnpj);
    const filePath = await generateDocx({ company, complement }, fileName);

    res.json({ fileName, filePath, message: 'Documento gerado com sucesso.' });
  } catch (err) { next(err); }
}

// GET /api/companies/:id/documents
export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const documents = await listDocuments(req.params.id);
    res.json(documents);
  } catch (err) { next(err); }
}
