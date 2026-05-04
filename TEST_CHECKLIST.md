# Checklist de Testes — Aditiva Pronto

## Setup

- [ ] `npm install` na raiz completa sem erros
- [ ] `scripts/init.sql` cria as 3 tabelas sem erro
- [ ] `.env` configurado com banco acessível
- [ ] Template `templates/termo_aditivo.docx` com os 5 placeholders

---

## Importação de Planilha

- [ ] Aceita `.xlsx` exportado do Domínio Registro
- [ ] Detecta coluna CNPJ (variantes: `CNPJ`, `C.N.P.J`, `CPF/CNPJ`)
- [ ] Detecta coluna Razão Social (variantes: `RAZÃO SOCIAL`, `RAZAO SOCIAL`)
- [ ] CNPJs inválidos são ignorados e reportados no campo `errors`
- [ ] Reimportar o mesmo arquivo não duplica empresas
- [ ] Reimportar com razão social atualizada → atualiza o registro existente
- [ ] Retorna `{ total, inserted, updated, skipped, errors }` corretos

## Sincronização de Pasta

- [ ] `POST /api/import/sync` processa o `.xlsx` mais recente em `IMPORT_FOLDER`
- [ ] Arquivos já processados não são reprocessados (se implementado)

---

## Dashboard

- [ ] Cards mostram contagens corretas
- [ ] Botão "Importar planilha" abre seletor de arquivo
- [ ] Após importar, cards atualizam automaticamente
- [ ] "Empresas pendentes" navega para lista filtrada por `status=pending`
- [ ] "Prontos para gerar" navega para lista filtrada por `status=ready`

---

## Lista de Empresas

- [ ] Exibe todas as empresas paginadas (20 por página)
- [ ] Filtro "Pendentes" mostra apenas empresas sem complemento
- [ ] Filtro "Prontas" mostra apenas empresas com complemento
- [ ] Busca por Razão Social funciona (parcial, case-insensitive)
- [ ] Busca por CNPJ funciona
- [ ] Badge verde "Pronta" para empresas com complemento
- [ ] Badge âmbar "Pendente" para empresas sem complemento
- [ ] Clicar na linha navega para o detalhe

---

## Formulário da Empresa

- [ ] Razão Social e CNPJ bloqueados (read-only)
- [ ] Nome do Sócio: obrigatório, impede submit se vazio
- [ ] CPF do Sócio: obrigatório, máscara aplicada, valida dígitos verificadores
- [ ] CPF inválido mostra mensagem de erro
- [ ] Campos opcionais aceitam qualquer string
- [ ] CEP aplica máscara `00000-000`
- [ ] Telefone aplica máscara `(00) 00000-0000` e `(00) 0000-0000`
- [ ] "Salvar dados" grava no banco sem recarregar a página
- [ ] Reabrir a página carrega os dados já salvos

---

## Pré-visualização

- [ ] Botão "Pré-visualizar" desabilitado se não há complemento salvo
- [ ] Modal exibe `texto_contratante` corretamente
- [ ] Com apenas Nome + CPF: texto mínimo sem blocos de endereço/contato
- [ ] Com endereço da empresa completo: bloco de endereço incluído
- [ ] Com endereço incompleto (campo faltando): bloco omitido
- [ ] Com dados pessoais do sócio completos: bloco incluído
- [ ] Com contatos completos: bloco de contatos incluído
- [ ] Sem vírgulas ou espaços órfãos no texto gerado

---

## Geração de DOCX

- [ ] Botão "Gerar DOCX" chama `POST /api/companies/:id/generate-docx`
- [ ] Arquivo salvo em `GENERATED_DIR`
- [ ] Registro criado em `generated_documents`
- [ ] Histórico de documentos exibe o novo arquivo
- [ ] Botão "Baixar" faz download do arquivo correto
- [ ] Abrindo o DOCX no Word: placeholders substituídos corretamente
- [ ] `data_extenso` no formato "4 de maio de 2025"
- [ ] Gerar múltiplas vezes cria múltiplos registros (não sobrescreve)

---

## API — Casos de Borda

- [ ] `GET /api/health` retorna `{ status: "ok" }`
- [ ] Upload de arquivo não-Excel retorna erro 400
- [ ] CNPJ inexistente em `GET /api/companies/:id` retorna 404
- [ ] Salvar complemento com CPF inválido retorna erro 400
- [ ] Gerar DOCX sem template existente retorna erro 500 com mensagem clara

---

## Docker

- [ ] `docker compose -f infra/docker-compose.yml up -d --build` sobe sem erros
- [ ] Banco inicializa com `init.sql` automaticamente
- [ ] App aguarda o banco estar healthy antes de conectar
- [ ] `GET http://localhost/api/health` responde via nginx
- [ ] Interface acessível em `http://localhost`
- [ ] Volumes persistem dados após `docker compose restart`

---

## Acessibilidade

- [ ] Todos os botões têm texto ou `aria-label`
- [ ] Modal tem `role="dialog"` e `aria-modal="true"`
- [ ] Formulário tem `<label>` para cada campo
- [ ] Campos obrigatórios marcados com asterisco e `aria-required`
- [ ] Contraste dos badges (verde/âmbar) ≥ 4.5:1
- [ ] Navegação por teclado: Tab percorre todos os campos
