import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  CheckCircle, Warning, CaretDown, Info,
} from '@phosphor-icons/react';
import type { Company, Complement } from '../types';
import { isValidCPF, maskCPF, maskCNPJ, maskCEP, maskPhone } from '../utils/validators';

// ── Props ────────────────────────────────────────────────────────────

interface Props {
  company:        Company;
  defaultValues?: Partial<Complement>;
  isSaving:       boolean;
  onSave:         (data: Complement) => void;
}

// ── Tipos de status de seção ─────────────────────────────────────────

type SectionStatus = 'empty' | 'partial' | 'complete';

function getSectionStatus(values: (string | undefined | null)[]): SectionStatus {
  const filled = values.filter(v => v && v.trim().length > 0).length;
  if (filled === 0)             return 'empty';
  if (filled === values.length) return 'complete';
  return 'partial';
}

function hasAnyData(defaultValues: Partial<Complement> | undefined, keys: (keyof Complement)[]): boolean {
  if (!defaultValues) return false;
  return keys.some(k => {
    const v = defaultValues[k];
    return v && String(v).trim().length > 0;
  });
}

// ── StatusBadge ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SectionStatus }) {
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium
                        text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30
                        border border-green-200 dark:border-green-800/50 rounded-full px-2 py-0.5">
        <CheckCircle size={10} weight="fill" /> Completa
      </span>
    );
  }
  if (status === 'partial') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium
                        text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30
                        border border-amber-200 dark:border-amber-800/50 rounded-full px-2 py-0.5">
        <Warning size={10} weight="fill" /> Parcial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium
                      text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800
                      border border-gray-200 dark:border-zinc-700 rounded-full px-2 py-0.5">
      Vazia
    </span>
  );
}

// ── Section always-open ───────────────────────────────────────────────

function Section({
  title, subtitle, children,
}: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card mt-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── CollapsibleSection ────────────────────────────────────────────────

interface CollapsibleProps {
  title:       string;
  subtitle?:   string;
  status:      SectionStatus;
  defaultOpen: boolean;
  children:    React.ReactNode;
}

function CollapsibleSection({ title, subtitle, status, defaultOpen, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card mt-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between text-left
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <StatusBadge status={status} />
          <CaretDown
            size={14}
            className={`text-gray-400 dark:text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="mt-4 space-y-4">

          {/* Nota sobre DOCX */}
          <div className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-zinc-500">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              Esta seção só será incluída no DOCX se <strong>todos os campos</strong> deste bloco forem preenchidos.
            </span>
          </div>

          {/* Aviso de seção parcial */}
          {status === 'partial' && (
            <div className="flex items-start gap-2 rounded-lg
                            bg-amber-50 dark:bg-amber-900/20
                            border border-amber-200 dark:border-amber-800/50 p-3">
              <Warning size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Você preencheu parte desta seção. Para incluir no DOCX, preencha todos os campos —
                ou deixe todos em branco para omitir a seção.
              </p>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────

function Field({
  label, error, required, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

// ── CompanyForm ───────────────────────────────────────────────────────

export default function CompanyForm({ company, defaultValues, isSaving, onSave }: Props) {
  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<Complement>({ defaultValues });

  useEffect(() => {
    if (!defaultValues) return;
    (Object.entries(defaultValues) as [keyof Complement, unknown][]).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') setValue(k, v as string);
    });
  }, [defaultValues, setValue]);

  const maskOn = (field: keyof Complement, fn: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(field, fn(e.target.value), { shouldValidate: true });

  const vals = watch();

  const statusEndEmpresa  = getSectionStatus([vals.endereco_empresa, vals.numero_empresa, vals.bairro_empresa, vals.cidade_empresa, vals.estado_empresa, vals.cep_empresa]);
  const statusDadosSocio  = getSectionStatus([vals.nacionalidade_socio, vals.estado_civil_socio, vals.profissao_socio]);
  const statusEndSocio    = getSectionStatus([vals.endereco_socio, vals.numero_socio, vals.bairro_socio, vals.cidade_socio, vals.estado_socio, vals.cep_socio]);
  const statusContatoAdm  = getSectionStatus([vals.contato_administrativo_nome, vals.contato_administrativo_telefone, vals.contato_administrativo_email]);
  const statusContatoFin  = getSectionStatus([vals.contato_financeiro_nome, vals.contato_financeiro_telefone, vals.contato_financeiro_email]);

  const openEndEmpresa = hasAnyData(defaultValues, ['endereco_empresa','numero_empresa','bairro_empresa','cidade_empresa','estado_empresa','cep_empresa']);
  const openDadosSocio = hasAnyData(defaultValues, ['nacionalidade_socio','estado_civil_socio','profissao_socio']);
  const openEndSocio   = hasAnyData(defaultValues, ['endereco_socio','numero_socio','bairro_socio','cidade_socio','estado_socio','cep_socio']);
  const openContatoAdm = hasAnyData(defaultValues, ['contato_administrativo_nome','contato_administrativo_telefone','contato_administrativo_email']);
  const openContatoFin = hasAnyData(defaultValues, ['contato_financeiro_nome','contato_financeiro_telefone','contato_financeiro_email']);

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>

      {/* ── 1. Dados da empresa (sempre aberto, read-only) ── */}
      <Section title="Dados da Empresa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Razão Social">
            <input className="input" value={company.razao_social} disabled readOnly />
          </Field>
          <Field label="CNPJ">
            <input className="input tabular-nums" value={maskCNPJ(company.cnpj)} disabled readOnly />
          </Field>
        </div>
      </Section>

      {/* ── 2. Dados do sócio (sempre aberto, obrigatório) ── */}
      <Section title="Dados do Sócio" subtitle="Obrigatório para gerar o Termo Aditivo">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo" required error={errors.nome_socio?.message}>
            <input
              className="input"
              placeholder="Nome completo do sócio"
              aria-required="true"
              {...register('nome_socio', { required: 'Campo obrigatório' })}
            />
          </Field>
          <Field label="CPF" required error={errors.cpf_socio?.message}>
            <input
              className="input tabular-nums"
              placeholder="000.000.000-00"
              aria-required="true"
              {...register('cpf_socio', {
                required: 'Campo obrigatório',
                validate: (v) => isValidCPF(v ?? '') || 'CPF inválido',
              })}
              onChange={maskOn('cpf_socio', maskCPF)}
              value={watch('cpf_socio') ?? ''}
            />
          </Field>
        </div>
      </Section>

      {/* ── 3. Endereço da empresa (colapsável) ── */}
      <CollapsibleSection
        title="Endereço da Empresa"
        subtitle="Preencha apenas se todos os campos estiverem disponíveis"
        status={statusEndEmpresa}
        defaultOpen={openEndEmpresa}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Field label="Logradouro">
              <input className="input" placeholder="Rua, Avenida…" {...register('endereco_empresa')} />
            </Field>
          </div>
          <Field label="Número">
            <input className="input" placeholder="123" {...register('numero_empresa')} />
          </Field>
          <Field label="Bairro">
            <input className="input" {...register('bairro_empresa')} />
          </Field>
          <Field label="Cidade">
            <input className="input" {...register('cidade_empresa')} />
          </Field>
          <Field label="Estado (UF)">
            <input className="input uppercase" maxLength={2} placeholder="SP" {...register('estado_empresa')} />
          </Field>
          <Field label="CEP">
            <input
              className="input tabular-nums" placeholder="00000-000"
              {...register('cep_empresa')}
              onChange={maskOn('cep_empresa', maskCEP)}
              value={watch('cep_empresa') ?? ''}
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* ── 4. Dados pessoais do sócio (colapsável) ── */}
      <CollapsibleSection
        title="Dados Pessoais do Sócio"
        status={statusDadosSocio}
        defaultOpen={openDadosSocio}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nacionalidade">
            <input className="input" placeholder="Brasileiro(a)" {...register('nacionalidade_socio')} />
          </Field>
          <Field label="Estado Civil">
            <select className="input" {...register('estado_civil_socio')}>
              <option value="">Selecione…</option>
              <option>Solteiro(a)</option>
              <option>Casado(a)</option>
              <option>Divorciado(a)</option>
              <option>Viúvo(a)</option>
              <option>União Estável</option>
            </select>
          </Field>
          <Field label="Profissão">
            <input className="input" {...register('profissao_socio')} />
          </Field>
        </div>
      </CollapsibleSection>

      {/* ── 5. Endereço do sócio (colapsável) ── */}
      <CollapsibleSection
        title="Endereço do Sócio"
        status={statusEndSocio}
        defaultOpen={openEndSocio}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Field label="Logradouro">
              <input className="input" placeholder="Rua, Avenida…" {...register('endereco_socio')} />
            </Field>
          </div>
          <Field label="Número">
            <input className="input" placeholder="123" {...register('numero_socio')} />
          </Field>
          <Field label="Bairro">
            <input className="input" {...register('bairro_socio')} />
          </Field>
          <Field label="Cidade">
            <input className="input" {...register('cidade_socio')} />
          </Field>
          <Field label="Estado (UF)">
            <input className="input uppercase" maxLength={2} placeholder="SP" {...register('estado_socio')} />
          </Field>
          <Field label="CEP">
            <input
              className="input tabular-nums" placeholder="00000-000"
              {...register('cep_socio')}
              onChange={maskOn('cep_socio', maskCEP)}
              value={watch('cep_socio') ?? ''}
            />
          </Field>
        </div>
      </CollapsibleSection>

      {/* ── 6. Contato Administrativo (colapsável) ── */}
      <CollapsibleSection
        title="Contato Administrativo"
        subtitle="Opcional — responsável administrativo"
        status={statusContatoAdm}
        defaultOpen={openContatoAdm}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nome">
            <input className="input" {...register('contato_administrativo_nome')} />
          </Field>
          <Field label="Telefone">
            <input
              className="input tabular-nums" placeholder="(00) 00000-0000"
              {...register('contato_administrativo_telefone')}
              onChange={maskOn('contato_administrativo_telefone', maskPhone)}
              value={watch('contato_administrativo_telefone') ?? ''}
            />
          </Field>
          <Field label="E-mail">
            <input className="input" type="email" placeholder="admin@empresa.com" {...register('contato_administrativo_email')} />
          </Field>
        </div>
      </CollapsibleSection>

      {/* ── 7. Contato Financeiro (colapsável) ── */}
      <CollapsibleSection
        title="Contato Financeiro"
        subtitle="Opcional — responsável financeiro"
        status={statusContatoFin}
        defaultOpen={openContatoFin}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nome">
            <input className="input" {...register('contato_financeiro_nome')} />
          </Field>
          <Field label="Telefone">
            <input
              className="input tabular-nums" placeholder="(00) 00000-0000"
              {...register('contato_financeiro_telefone')}
              onChange={maskOn('contato_financeiro_telefone', maskPhone)}
              value={watch('contato_financeiro_telefone') ?? ''}
            />
          </Field>
          <Field label="E-mail">
            <input className="input" type="email" placeholder="financeiro@empresa.com" {...register('contato_financeiro_email')} />
          </Field>
        </div>
      </CollapsibleSection>

      {/* ── Salvar ── */}
      <div className="mt-6 flex justify-end">
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar dados'}
        </button>
      </div>
    </form>
  );
}

// ── Utilitário exportado: seções com preenchimento parcial ────────────

export function checkPartialSections(complement: Partial<Complement> | null | undefined): string[] {
  if (!complement) return [];
  const sections: Array<{ name: string; fields: (string | null | undefined)[] }> = [
    { name: 'Endereço da Empresa',      fields: [complement.endereco_empresa, complement.numero_empresa, complement.bairro_empresa, complement.cidade_empresa, complement.estado_empresa, complement.cep_empresa] },
    { name: 'Dados Pessoais do Sócio',  fields: [complement.nacionalidade_socio, complement.estado_civil_socio, complement.profissao_socio] },
    { name: 'Endereço do Sócio',        fields: [complement.endereco_socio, complement.numero_socio, complement.bairro_socio, complement.cidade_socio, complement.estado_socio, complement.cep_socio] },
    { name: 'Contato Administrativo',   fields: [complement.contato_administrativo_nome, complement.contato_administrativo_telefone, complement.contato_administrativo_email] },
    { name: 'Contato Financeiro',       fields: [complement.contato_financeiro_nome, complement.contato_financeiro_telefone, complement.contato_financeiro_email] },
  ];
  return sections
    .filter(({ fields }) => {
      const filled = fields.filter(f => f && f.trim().length > 0).length;
      return filled > 0 && filled < fields.length;
    })
    .map(s => s.name);
}
