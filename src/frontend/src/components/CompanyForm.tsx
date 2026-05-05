import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Company, Complement } from '../types';
import { isValidCPF, maskCPF, maskCNPJ, maskCEP, maskPhone } from '../utils/validators';

interface Props {
  company:       Company;
  defaultValues?: Partial<Complement>;
  isSaving:      boolean;
  onSave:        (data: Complement) => void;
}

// ── Seção de formulário ──────────────────────────────────────────
function Section({
  title, subtitle, children,
}: {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
}) {
  return (
    <div className="card mt-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Campo com label e erro ───────────────────────────────────────
function Field({
  label, error, required, children,
}: {
  label:     string;
  error?:    string;
  required?: boolean;
  children:  React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden>*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
export default function CompanyForm({ company, defaultValues, isSaving, onSave }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Complement>({ defaultValues });

  // Popula o formulário quando os dados chegam do banco
  useEffect(() => {
    if (!defaultValues) return;
    (Object.entries(defaultValues) as [keyof Complement, unknown][]).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        setValue(k, v as string);
      }
    });
  }, [defaultValues, setValue]);

  const maskOn = (field: keyof Complement, fn: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValue(field, fn(e.target.value), { shouldValidate: true });

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>

      {/* ── 1. Dados da empresa (read-only) ── */}
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

      {/* ── 2. Dados do sócio (obrigatório) ── */}
      <Section
        title="Dados do Sócio"
        subtitle="Campos obrigatórios para geração do Termo Aditivo"
      >
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

      {/* ── 3. Endereço da empresa (opcional) ── */}
      <Section
        title="Endereço da Empresa"
        subtitle="Preencha somente se todos os campos do bloco estiverem disponíveis"
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
            <input
              className="input uppercase"
              maxLength={2}
              placeholder="SP"
              {...register('estado_empresa')}
            />
          </Field>
          <Field label="CEP">
            <input
              className="input tabular-nums"
              placeholder="00000-000"
              {...register('cep_empresa')}
              onChange={maskOn('cep_empresa', maskCEP)}
              value={watch('cep_empresa') ?? ''}
            />
          </Field>
        </div>
      </Section>

      {/* ── 4. Dados pessoais do sócio (opcional) ── */}
      <Section title="Dados Pessoais do Sócio" subtitle="Opcional">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nacionalidade">
            <input
              className="input"
              placeholder="Brasileiro(a)"
              {...register('nacionalidade_socio')}
            />
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
      </Section>

      {/* ── 5. Endereço do sócio (opcional) ── */}
      <Section title="Endereço do Sócio" subtitle="Opcional">
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
            <input
              className="input uppercase"
              maxLength={2}
              placeholder="SP"
              {...register('estado_socio')}
            />
          </Field>
          <Field label="CEP">
            <input
              className="input tabular-nums"
              placeholder="00000-000"
              {...register('cep_socio')}
              onChange={maskOn('cep_socio', maskCEP)}
              value={watch('cep_socio') ?? ''}
            />
          </Field>
        </div>
      </Section>

      {/* ── 6. Contatos (opcional) ── */}
      <Section title="Contatos" subtitle="Opcional — administrativo e financeiro">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Administrativo */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
              Administrativo
            </p>
            <Field label="Nome">
              <input className="input" {...register('contato_administrativo_nome')} />
            </Field>
            <Field label="Telefone">
              <input
                className="input tabular-nums"
                placeholder="(00) 00000-0000"
                {...register('contato_administrativo_telefone')}
                onChange={maskOn('contato_administrativo_telefone', maskPhone)}
                value={watch('contato_administrativo_telefone') ?? ''}
              />
            </Field>
            <Field label="E-mail">
              <input
                className="input"
                type="email"
                placeholder="admin@empresa.com"
                {...register('contato_administrativo_email')}
              />
            </Field>
          </div>

          {/* Financeiro */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
              Financeiro
            </p>
            <Field label="Nome">
              <input className="input" {...register('contato_financeiro_nome')} />
            </Field>
            <Field label="Telefone">
              <input
                className="input tabular-nums"
                placeholder="(00) 00000-0000"
                {...register('contato_financeiro_telefone')}
                onChange={maskOn('contato_financeiro_telefone', maskPhone)}
                value={watch('contato_financeiro_telefone') ?? ''}
              />
            </Field>
            <Field label="E-mail">
              <input
                className="input"
                type="email"
                placeholder="financeiro@empresa.com"
                {...register('contato_financeiro_email')}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Salvar ── */}
      <div className="mt-6 flex justify-end">
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar dados'}
        </button>
      </div>
    </form>
  );
}
