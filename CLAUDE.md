# Projeto: aditiva-pronto

Ambiente de desenvolvimento full-stack/frontend com foco em UI/UX de alto nível, React/Next.js, acessibilidade, segurança, documentação e testes.

---

## Skills Instaladas

As seguintes skills estão disponíveis em `.claude/skills/`:

| Skill | Pasta | Prioridade |
|-------|-------|-----------|
| Trail of Bits Security | `trail-of-bits-security` | 1 (MÁXIMA) |
| AccessLint | `accesslint` | 2 |
| Vercel React Best Practices | `vercel-react-best-practices` | 3 |
| Vercel Composition Patterns | `vercel-composition-patterns` | 3 |
| Vercel Web Design Guidelines | `vercel-web-design-guidelines` | 3 |
| Anthropic Frontend Design | `frontend-design` | 4 |
| UI/UX Pro Max | `ui-ux-pro-max` | 4 |
| Bencium UX Designer | `bencium-ux-designer` | 4 |
| Webapp Testing | `webapp-testing` | 5 |
| Document Skills | `document-skills` | 6 |
| Skill Creator | `skill-creator` | 7 |
| Vercel React Native | `vercel-react-native` | 8 (mobile only) |
| Remotion Best Practices | `remotion-best-practices` | 9 (video only) |
| Superpowers | `superpowers` | 10 (auxiliar) |
| GStack | `gstack` | 10 (auxiliar) |
| Firecrawl | `firecrawl` | 11 (crawling only) |

---

## Regras de Prioridade

Quando houver conflito entre skills, aplicar esta ordem:

### 1. Segurança — Trail of Bits Security (MÁXIMA PRIORIDADE)

A segurança vem antes de tudo. Nenhuma sugestão de outra skill deve sobrescrever uma exigência de segurança.

- Sempre validar autenticação e autorização no servidor
- Nunca confiar em dados do cliente sem validação
- Sanitizar toda entrada do usuário
- Nunca commitar secrets, API keys ou credentials no código
- Usar variáveis de ambiente para todos os segredos
- Verificar OWASP Top 10 antes de qualquer implementação sensível

### 2. Acessibilidade — AccessLint (OBRIGATÓRIA)

Nenhuma decisão visual ou estrutural pode quebrar acessibilidade básica.

- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande
- Todos os elementos interativos devem ser acessíveis via teclado
- Toda imagem precisa de `alt` text
- Formulários precisam de `<label>` visíveis
- Touch targets mínimos: 44×44px
- `lang="pt-BR"` no elemento `<html>`

### 3. React/Next.js — Skills Vercel (para projetos web)

Para qualquer código React ou Next.js:

- **Vercel React Best Practices**: performance, otimização de bundle, prevenção de waterfalls
- **Vercel Composition Patterns**: arquitetura de componentes, evitar prop drilling
- **Vercel Web Design Guidelines**: padrões de design web e UX

### 4. UI/UX — Skills de Design (apoio criativo)

Para decisões visuais e de experiência do usuário:

- Usar **Anthropic Frontend Design** como direção criativa principal
- Usar **UI/UX Pro Max** para sistema de design e guidelines práticos
- Usar **Bencium UX Designer** para identidade visual e filosofia de design
- Em conflito: escolher a solução mais simples, acessível, consistente e fácil de manter

### 5. Testes — Webapp Testing

Usar para:
- Testes end-to-end de fluxos críticos
- Verificação de acessibilidade em app rodando
- Testes de responsividade
- Regressões visuais

### 6. Documentação — Document Skills (built-in)

Usar quando criar ou atualizar:
- README
- Docs técnicas
- Decisões arquiteturais (ADRs)
- Guias de uso e onboarding

### 7. Criação de Skills — Skill Creator

Usar apenas quando criar, modificar ou empacotar novas skills.

### 8. React Native — Vercel React Native Skills

**Usar APENAS quando o projeto envolver código mobile ou React Native.**
Não misturar padrões mobile em componentes web.

### 9. Remotion — Remotion Best Practices

**Usar APENAS em partes do projeto relacionadas a vídeos, motion graphics ou geração programática de vídeo com Remotion.**

### 10. Superpowers e GStack (auxiliares)

Skills de produtividade e metodologia. Não sobrescrevem regras de segurança, acessibilidade ou boas práticas. Usar para:
- Superpowers: fluxo de desenvolvimento estruturado (TDD, worktrees, code review)
- GStack: revisões de produto, design consultations, QA, security `/cso`

### 11. Firecrawl (crawling externo)

**Usar APENAS quando necessário coletar, auditar ou transformar conteúdo externo da web.**
Nunca usar para tarefas internas do projeto.

---

## Stack Padrão

Para este projeto, salvo indicação contrária:

- **Framework**: Next.js (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Ícones**: @phosphor-icons/react
- **Animações**: Framer Motion / Motion
- **Testes**: Playwright (e2e) + Vitest (unit)
- **Estado**: Zustand (client) + TanStack Query (server)
- **Auth**: NextAuth.js v5
- **Linting**: ESLint + Prettier

---

## Conflitos Conhecidos Entre Skills

| Conflito | Resolução |
|----------|-----------|
| Design criativo vs. Acessibilidade | Acessibilidade vence sempre. Adaptar o design. |
| Performance (bundle) vs. Animação | Bundle size é crítico. Lazy load componentes de animação. |
| Design mobile vs. Design web | Usar skill correta para cada plataforma. Não misturar. |
| GStack `/cso` vs. Trail of Bits Security | Trail of Bits tem prioridade para auditorias de segurança. |
| Bencium (fontes experimentais) vs. Performance | Avaliar impacto no LCP. Se > 200ms, usar subset de fonte. |

---

## Comandos Rápidos

### Instalar plugins avançados (requer Claude Code CLI)

```bash
# Trail of Bits Security (auditoria avançada)
/plugin marketplace add trailofbits/skills
/plugin install static-analysis@trailofbits-skills
/plugin install supply-chain-risk-auditor@trailofbits-skills

# AccessLint (auditoria de acessibilidade ao vivo)
/plugin marketplace add accesslint/claude-marketplace
/plugin install accesslint:audit@accesslint-marketplace

# Superpowers (metodologia de desenvolvimento)
/plugin install superpowers@claude-plugins-official

# Bencium Marketplace (mais skills de design)
/plugin marketplace add bencium/bencium-claude-code-design-skill
/plugin install bencium-innovative-ux-designer@bencium-marketplace

# Firecrawl (adicionar chave API em .claude/settings.json)
# Obter chave em: https://www.firecrawl.dev/app/api-keys
```

### Instalar Vercel skills via npx (quando Node.js estiver disponível)

```bash
npx skills add vercel-labs/agent-skills --skill react-best-practices
npx skills add vercel-labs/agent-skills --skill composition-patterns
npx skills add vercel-labs/agent-skills --skill web-design-guidelines
npx skills add vercel-labs/agent-skills --skill react-native-skills
```

---

## Configuração do Firecrawl

1. Obter API key em https://www.firecrawl.dev/app/api-keys
2. Editar `.claude/settings.json` e substituir `SUBSTITUA_PELA_SUA_CHAVE_FIRECRAWL` pela chave real
3. Alternativamente: `claude mcp add firecrawl --url https://mcp.firecrawl.dev/SUA_CHAVE/v2/mcp`
