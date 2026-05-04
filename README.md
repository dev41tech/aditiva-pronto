# Aditiva Pronto

Aplicação web para geração automatizada de **Termos Aditivos** a partir de relatórios exportados do sistema Domínio Registro.

---

## Pré-requisitos

- Node.js 20+
- MySQL 8.0+ (ou Docker)
- Template DOCX (`templates/termo_aditivo.docx`) com os placeholders abaixo

### Placeholders no template Word

| Placeholder | Descrição |
|---|---|
| `{texto_contratante}` | Bloco completo de qualificação da empresa |
| `{nome_socio}` | Nome do sócio (para assinatura) |
| `{razao_social}` | Razão Social da empresa |
| `{cnpj}` | CNPJ formatado |
| `{data_extenso}` | Data de geração por extenso |

---

## Desenvolvimento local

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais de banco e caminhos de arquivo
```

### 2. Criar banco de dados

```bash
mysql -u root -p < scripts/init.sql
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Colocar o template DOCX

Copie seu template Word para `templates/termo_aditivo.docx`.

### 5. Iniciar backend e frontend

```bash
# Em dois terminais separados:
npm run dev:backend   # porta 3001
npm run dev:frontend  # porta 5173
```

Acesse: **http://localhost:5173**

---

## Deploy com Docker

### 1. Copiar e configurar variáveis

```bash
cp .env.example .env
# Edite DB_ROOT_PASSWORD, DB_PASS com senhas fortes
```

### 2. Colocar o template

```bash
mkdir -p templates
cp "caminho/para/Template Termo Aditivo.docx" templates/termo_aditivo.docx
```

### 3. Subir os containers

```bash
docker compose -f infra/docker-compose.yml --env-file .env up -d --build
```

Acesse: **http://localhost** (nginx na porta 80)

### 4. Comandos úteis

```bash
# Ver logs do app
docker compose -f infra/docker-compose.yml logs -f app

# Reiniciar apenas o app (após atualizar código)
docker compose -f infra/docker-compose.yml up -d --build app

# Parar tudo
docker compose -f infra/docker-compose.yml down
```

---

## Fluxo de uso

1. **Importar planilha** — Exporte a "Relação de Empresas" do Domínio Registro como `.xlsx` e importe pela tela Dashboard.
2. **Preencher dados** — Na tela de cada empresa, informe Nome do Sócio e CPF (obrigatórios) e demais campos opcionais.
3. **Pré-visualizar** — Veja o bloco `texto_contratante` montado dinamicamente antes de gerar.
4. **Gerar DOCX** — O arquivo é gerado e salvo em `GENERATED_DIR`; baixe pelo histórico da empresa.

---

## Estrutura do projeto

```
aditiva-pronto/
├── scripts/           # SQL de criação do banco
├── src/
│   ├── backend/       # Express + TypeScript
│   └── frontend/      # React + Vite + Tailwind
├── templates/         # Template DOCX (não versionado)
├── infra/             # Dockerfile, docker-compose, nginx
└── automation/        # Script PowerShell de extração do Domínio
```

---

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `DB_HOST` | Host do MySQL | `localhost` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_NAME` | Nome do banco | `aditiva_pronto` |
| `DB_USER` | Usuário do banco | — |
| `DB_PASS` | Senha do banco | — |
| `PORT` | Porta do servidor backend | `3001` |
| `EXPORTS_DIR` | Pasta com exports do Domínio | `./exports` |
| `GENERATED_DIR` | Pasta de saída dos DOCX | `./generated` |
| `TEMPLATE_PATH` | Caminho do template .docx | `./templates/termo_aditivo.docx` |
