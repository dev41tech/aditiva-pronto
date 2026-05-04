# Decisões Técnicas — Aditiva Pronto

## ADR-001: MySQL com CHAR(36) UUID como chave primária

**Contexto:** A aplicação precisa de IDs únicos para empresas, complementos e documentos.

**Decisão:** `CHAR(36) NOT NULL DEFAULT (UUID())` — UUID v1 gerado pelo MySQL.

**Motivo:** Simplicidade de setup (sem extensão UUID), compatibilidade com MySQL 8.0, IDs legíveis em URLs e logs sem colisão entre ambientes.

**Trade-off:** UUID como PK é maior que INT e fragmenta índices. Aceitável dado o volume esperado (< 10k empresas).

---

## ADR-002: Upsert por CNPJ no import

**Contexto:** O mesmo arquivo pode ser importado mais de uma vez; o Domínio pode atualizar a razão social de uma empresa.

**Decisão:** Ao importar, verifica se o CNPJ já existe. Se sim, atualiza apenas `razao_social`. Se não, insere novo registro.

**Motivo:** Evita duplicatas e mantém complementos existentes intactos.

---

## ADR-003: Texto do contratante montado no backend

**Contexto:** O `texto_contratante` precisa de lógica condicional: inclui endereço, dados pessoais e contatos apenas quando todos os campos de cada bloco estão preenchidos.

**Decisão:** `buildContratanteText()` em `textBuilderService.ts` — função pura no backend, testável isoladamente.

**Motivo:** Garante consistência independente de qual cliente consome a API. A pré-visualização e a geração do DOCX usam a mesma função.

---

## ADR-004: docxtemplater para geração de DOCX

**Contexto:** O template final deve ser um arquivo Word editável (.docx), não PDF.

**Decisão:** `docxtemplater` + `PizZip` com placeholders `{campo}` no template.

**Motivo:** O template pode ser editado por qualquer pessoa usando o Word, sem precisar de desenvolvedor. Alternativas (html-to-docx, pdf-lib) não preservam formatação arbitrária do Word.

**Trade-off:** O template precisa ter exatamente os placeholders corretos. Erros de digitação em placeholders resultam em campos em branco silenciosamente.

---

## ADR-005: Frontend servido pelo backend em produção

**Contexto:** Simplificar o deploy — um único processo Node.js em vez de servidor web separado.

**Decisão:** Em `NODE_ENV=production`, Express serve o build do Vite em `dist/frontend` como arquivos estáticos. O nginx faz proxy de tudo para a porta 3001.

**Motivo:** Reduz containers e complexidade de deploy. O nginx ainda é necessário para TLS e `client_max_body_size`.

**Trade-off:** O build do frontend precisa ser feito antes do start do backend. Resolvido no Dockerfile multi-stage.

---

## ADR-006: Sem autenticação no MVP

**Contexto:** A aplicação é interna para uso da equipe da 41 Contábil.

**Decisão:** Sem sistema de autenticação no MVP. O acesso é controlado por rede (VPN ou IP allowlist no nginx).

**Motivo:** Reduz escopo e tempo de desenvolvimento. Pode ser adicionado como NextAuth.js ou sessões Express em iteração futura.

**Risco:** Se exposto à internet sem proteção de rede, qualquer pessoa tem acesso.

---

## ADR-007: npm workspaces para monorepo

**Contexto:** Backend e frontend compartilham tipos TypeScript.

**Decisão:** `npm workspaces` no `package.json` raiz com workspaces `src/backend` e `src/frontend`.

**Motivo:** Permite rodar `npm install` uma vez, hoist de dependências comuns, e scripts `--workspace=` para build seletivo.

**Trade-off:** A pasta `shared/` com tipos compartilhados requer alias `@shared/*` tanto no `tsconfig.json` do backend quanto no `vite.config.ts`.
