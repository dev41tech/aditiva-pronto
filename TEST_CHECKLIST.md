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

---

## Paginação Direta (nova feature)

- [ ] Campo de número de página exibe a página atual ao carregar
- [ ] Digitar número e pressionar **Enter** navega para a página
- [ ] Clicar no botão **Ir** navega para a página digitada
- [ ] Sair do campo (blur) sem confirmar não navega
- [ ] Digitar página **0** é ajustado para página 1
- [ ] Digitar página maior que o total é ajustado para a última página
- [ ] Digitar letras é ignorado (campo aceita apenas números)
- [ ] URL reflete o parâmetro `?page=N` após navegação
- [ ] Recarregar a página com `?page=3` abre diretamente na página 3
- [ ] Aplicar filtro de busca reseta para a página 1
- [ ] Aplicar filtro de status reseta para a página 1
- [ ] Botões "Anterior" e "Próxima" continuam funcionando normalmente

---

## Responsável (nova feature)

### Usuário atual
- [ ] Seletor "Você é:" aparece no cabeçalho da lista
- [ ] Escolher um nome persiste após recarregar a página (localStorage)
- [ ] Valor persiste entre abas do mesmo navegador

### Atribuição por linha
- [ ] Coluna "Responsável" exibe `<select>` com os nomes disponíveis + opção em branco
- [ ] Selecionar um nome faz chamada `PATCH /companies/:id/responsavel` e atualiza a célula
- [ ] Selecionar opção em branco remove o responsável (salva `null`)
- [ ] Clicar no select não abre o detalhe da empresa (stopPropagation)
- [ ] Após atribuir, recarregar a página mantém o responsável salvo

### Filtro por responsável
- [ ] Dropdown "Filtrar por responsável" exibe "Todos", nomes e "Sem responsável"
- [ ] Selecionar um nome lista apenas empresas com aquele responsável
- [ ] Selecionar "Sem responsável" lista apenas empresas sem responsável
- [ ] Selecionar "Todos" remove o filtro
- [ ] Filtro por responsável combina corretamente com filtro de status e busca
- [ ] Filtro por responsável combina com paginação direta

### Atribuição em massa
- [ ] Botão "Atribuição em massa" exibe/oculta o painel
- [ ] Painel tem select de responsável + campos "Da página" e "Até a página"
- [ ] Campos de página têm valores padrão 1 e página atual
- [ ] Clicar "Atribuir" com responsável em branco exibe toast de erro
- [ ] Atribuição em massa bem-sucedida exibe toast de sucesso
- [ ] Após atribuição, a lista é recarregada com os responsáveis atualizados
- [ ] Página fora do intervalo válido é ajustada automaticamente

---

## Status Inativo (nova feature)

### Badge e visualização
- [ ] Empresa com `inativo = 1` exibe badge cinza "Inativa" (ícone Prohibit)
- [ ] Empresa ativa exibe badge verde "Pronta" ou âmbar "Pendente" normalmente
- [ ] Badge "Inativa" tem contraste adequado (texto cinza sobre fundo cinza claro) ≥ 4.5:1

### Aba de filtro
- [ ] Aba "Inativas" aparece no seletor de status
- [ ] Aba "Inativas" lista apenas empresas com `inativo = 1`
- [ ] Aba "Todas" exclui inativas (mostra apenas ativas)
- [ ] Abas "Pendentes" e "Prontas" excluem inativas

### Contagens no Dashboard
- [ ] Card "Empresas" conta apenas ativas
- [ ] Card "Pendentes" não inclui inativas
- [ ] Card "Prontas" não inclui inativas
- [ ] Inativos não aparecem como pendentes mesmo que não tenham complemento

### Marcação como inativo
- [ ] Na página de detalhe da empresa, existe toggle/botão para marcar como inativa
- [ ] Marcar como inativa chama `PATCH /companies/:id/status` com `{ inativo: true }`
- [ ] Após marcar, o badge muda para cinza "Inativa"
- [ ] Reativar chama o mesmo endpoint com `{ inativo: false }` e restaura o badge correto

---

## Regressão Geral (smoke test pós-feature)

- [ ] Gerar DOCX de uma empresa "Pronta" continua funcionando sem erros
- [ ] Exportar relatório (xlsx) inclui coluna "Responsável" com valores corretos
- [ ] Exportar relatório (csv) inclui coluna "Responsável"
- [ ] Exportar com filtro "Inativas" exporta apenas empresas inativas
- [ ] Exportar com filtro "Todas (exceto inativas)" não inclui inativas
- [ ] Importar planilha não sobrescreve campos `responsavel` e `inativo` já definidos
- [ ] Sincronização automática (`POST /api/import/sync`) não reseta `responsavel` e `inativo`
