import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Company, Complement } from '../types';
import { isValidCPF, maskCPF, maskCNPJ, maskCEP, maskPhone } from '../utils/validators';

interface Props {
  company: Company;
  defaultValues?: Partial<Complement>;
  isSaving: boolean;
  onSave: (data: Complement) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card mt-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label, error, required, children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function CompanyForm({ company, defaultValues, isSaving, onSave }: Props) {
  const {
    register, handleSubmit, setValue, watch, formState: { errors },
  } = useForm<Complement>({ defaultValues });

  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([k, v]) => {
        if (v !== undefined && v !== null) setValue(k as keyof Complement, v as string);
      });
    }
  }, [defaultValues, setValue]);

  const makeMaskHandler = (field: keyof Complement, fn: (v: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(field, fn(e.target.value), { shouldValidate: true });
    };

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate>
      {/* Empresa (read-only) */}
      <Section title="Empresa">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Razão Social">
            <input className="input" value={company.razao_social} disabled />
          </Field>
          <Field label="CNPJ">
            <input className="input tabular-nums" value={maskCNPJ(company.cnpj)} disabled />
          </Field>
        </div>
      </Section>

      {/* Sócio (obrigatório) */}
      <Section title="Sócio — dados obrigatórios">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do Sócio" required error={errors.nome_socio?.message}>
            <input
              className="input"
              placeholder="Nome completo"
              {...register('nome_socio', { required: 'Campo obrigatório' })}
            />
          </Field>
          <Field label="CPF do Sócio" required error={errors.cpf_socio?.message}>
            <input
              className="input tabular-nums"
              placeholder="000.000.000-00"
              {...register('cpf_socio', {
                required: 'Campo obrigatório',
                validate: (v) => isValidCPF(v ?? '') || 'CPF inválido',
              })}
              onChange={makeMaskHandler('cpf_socio', maskCPF)}
              value={watch('cpf_socio') ?? ''}
            />
          </Field>
        </div>
      </Section>

      {/* Endereço da empresa */}
      <Section title="Endereço da Empresa (opcional)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Field label="Logradouro">
              <input className="input" placeholder="Rua, Av…" {...register('endereco_empresa')} />
            </Field>
          </div>
          <Field label="Número">
            <input className="input" placeholder="Ex: 123" {...register('numero_empresa')} />
          </Field>
          <Field label="Bairro">
            <input className="input" {...register('bairro_empresa')} />
          </Field>
          <Field label="Cidade">
            <input className="input" {...register('cidade_empresa')} />
          </Field>
          <Field label="Estado (UF)">
            <input className="input" maxLength={2} placeholder="SP" {...register('estado_empresa')} />
          </Field>
          <Field label="CEP">
            <input
              className="input tabular-nums"
              placeholder="00000-000"
              {...register('cep_empresa')}
              onChange={makeMaskHandler('cep_empresa', maskCEP)}
              value={watch('cep_empresa') ?? ''}
            />
          </Field>
        </div>
      </Section>

      {/* Dados pessoais do sócio */}
      <Section title="Dados Pessoais do Sócio (opcional)">
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
      </Section>

      {/* Endereço do sócio */}
      <Section title="Endereço do Sócio (opcional)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Field label="Logradouro">
              <input className="input" placeholder="Rua, Av…" {...register('endereco_socio')} />
            </Field>
          </div>
          <Field label="Número">
            <input className="input" placeholder="Ex: 123" {...register('numero_socio')} />
          </Field>
          <Field label="Bairro">
            <input className="input" {...register('bairro_socio')} />
          </Field>
          <Field label="Cidade">
            <input className="input" {...register('cidade_socio')} />
          </Field>
          <Field label="Estado (UF)">
            <input className="input" maxLength={2} placeholder="SP" {...register('estado_socio')} />
          </Field>
          <Field label="CEP">
            <input
              className="input tabular-nums"
              placeholder="00000-000"
              {...register('cep_socio')}
              onChange={makeMaskHandler('cep_socio', maskCEP)}
              value={watch('cep_socio') ?? ''}
            />
          </Field>
        </div>
      </Section>

      {/* Contato administrativo */}
      <Section title="Contato Administrativo (opcional)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nome">
            <input className="input" {...register('contato_administrativo_nome')} />
          </Field>
          <Field label="Telefone">
            <input
              className="input tabular-nums"
              placeholder="(00) 00000-0000"
              {...register('contato_administrativo_telefone')}
              onChange={makeMaskHandler('contato_administrativo_telefone', maskPhone)}
              value={watch('contato_administrativo_telefone') ?? ''}
            />
          </Field>
          <Field label="E-mail">
            <input className="input" type="email" {...register('contato_administrativo_email')} />
          </Field>
        </div>
      </Section>

      {/* Contato financeiro */}
      <Section title="Contato Financeiro (opcional)">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nome">
            <input className="input" {...register('contato_financeiro_nome')} />
          </Field>
          <Field label="Telefone">
            <input
              className="input tabular-nums"
              placeholder="(00) 00000-0000"
              {...register('contato_financeiro_telefone')}
              onChange={makeMaskHandler('contato_financeiro_telefone', maskPhone)}
              value={watch('contato_financeiro_telefone') ?? ''}
            />
          </Field>
          <Field label="E-mail">
            <input className="input" type="email" {...register('contato_financeiro_email')} />
          </Field>
        </div>
      </Section>

      <div className="mt-6 flex justify-end">
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Salvando…' : 'Salvar dados'}
        </button>
      </div>
    </form>
  );
}
