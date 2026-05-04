# Skills Instaladas — aditiva-pronto

Documentação completa das skills configuradas neste projeto. Gerado em 2026-05-04.

---

## Resumo de Status

| # | Skill | Status | Método |
|---|-------|--------|--------|
| 1 | Anthropic Frontend Design | ✅ Instalada | SKILL.md local |
| 2 | Vercel Web Design Guidelines | ✅ Instalada | SKILL.md local |
| 3 | Vercel React Best Practices | ✅ Instalada | SKILL.md local |
| 4 | Vercel Composition Patterns | ✅ Instalada | SKILL.md local |
| 5 | UI/UX Pro Max | ✅ Instalada | SKILL.md local |
| 6 | Bencium UX Designer | ✅ Instalada | SKILL.md local |
| 7 | AccessLint | ✅ Instalada (básico) | SKILL.md local |
| 8 | Vercel React Native Skills | ✅ Instalada | SKILL.md local |
| 9 | Document Skills | ✅ Disponível | Built-in Claude Code |
| 10 | Trail of Bits Security | ✅ Instalada (básico) | SKILL.md local |
| 11 | Skill Creator | ✅ Disponível | Built-in + SKILL.md local |
| 12 | Webapp Testing | ✅ Instalada | SKILL.md local |
| 13 | Remotion Best Practices | ✅ Instalada | SKILL.md local |
| 14 | Superpowers | ✅ Instalada (básico) | SKILL.md local |
| 15 | GStack | ✅ Instalada (básico) | SKILL.md local |
| 16 | Firecrawl | ⚠️ Configurada (precisa de API key) | MCP Server + SKILL.md |

**Notas:**
- "Básico" = SKILL.md com instruções completas. Plugin avançado disponível via `/plugin install` (ver comandos em `CLAUDE.md`).
- "Built-in" = disponível nativamente no Claude Code via `Skill tool`.
- Firecrawl requer API key em `.claude/settings.json`.

---

## Detalhamento por Skill

### 1. Anthropic Frontend Design

**Fonte**: [anthropics/claude-code](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/)
**Arquivo**: `.claude/skills/frontend-design/SKILL.md`
**Prioridade**: 4 (criativo)

**Função**: Cria interfaces frontend distintivas e de alto nível, evitando estéticas genéricas de IA ("AI slop"). Guia decisões de tipografia, cor, layout, motion e composição visual.

**Quando usar**:
- Construir componentes, páginas ou interfaces do zero
- Precisar de direção estética e criativa
- Querer designs memoráveis com personalidade

**Não usar para**: Revisões de acessibilidade ou performance — use AccessLint e Vercel React Best Practices.

---

### 2. Vercel Web Design Guidelines

**Fonte**: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
**Arquivo**: `.claude/skills/vercel-web-design-guidelines/SKILL.md`
**Prioridade**: 3 (boas práticas web)

**Função**: Audita código UI contra 100+ regras de design web, cobrindo acessibilidade, performance, responsividade e padrões de UX. Busca as guidelines atualizadas do repositório oficial da Vercel.

**Quando usar**:
- "Revisa minha UI"
- "Audita design"
- "Verifica acessibilidade"
- "Checa contra boas práticas"

---

### 3. Vercel React Best Practices

**Fonte**: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)
**Arquivo**: `.claude/skills/vercel-react-best-practices/SKILL.md`
**Prioridade**: 3 (performance React)

**Função**: 70 regras de otimização de performance para React e Next.js, organizadas em 8 categorias por impacto. Cobre: eliminação de waterfalls, bundle size, server performance, data fetching, re-renders.

**Quando usar**:
- Escrever ou revisar componentes React/Next.js
- Implementar data fetching
- Otimizar bundle size
- Refatorar código com problemas de performance

---

### 4. Vercel Composition Patterns

**Fonte**: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns)
**Arquivo**: `.claude/skills/vercel-composition-patterns/SKILL.md`
**Prioridade**: 3 (arquitetura de componentes)

**Função**: Padrões de composição React para componentes flexíveis e escaláveis. Evita proliferação de boolean props via compound components, render props e context providers.

**Quando usar**:
- Componente tem 3+ boolean props
- Construindo biblioteca de componentes reutilizáveis
- Projetando APIs de componentes flexíveis

---

### 5. UI/UX Pro Max

**Fonte**: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
**Arquivo**: `.claude/skills/ui-ux-pro-max/SKILL.md`
**Prioridade**: 4 (sistema de design)

**Função**: Sistema de design profissional com 50+ estilos, 161 paletas de cor, 57 combinações de fontes, 99 diretrizes de UX e 25 tipos de gráfico. Cobre React, Next.js, Vue, React Native, Flutter, Tailwind, shadcn/ui.

**Quando usar**:
- Qualquer decisão de estrutura UI ou layout
- Seleção de paleta de cores ou tipografia
- Padrões de interação e fluxos de UX
- Sistema de design e tokens
- Gráficos e visualização de dados

---

### 6. Bencium UX Designer

**Fonte**: [bencium/bencium-claude-code-design-skill](https://github.com/bencium/bencium-claude-code-design-skill)
**Arquivo**: `.claude/skills/bencium-ux-designer/SKILL.md`
**Prioridade**: 4 (identidade visual)

**Função**: Guia de design UX abrangente com ênfase em interfaces distintivas com identidade visual forte. Cobre design thinking, 11 direções estéticas, standards de tipografia, cor e espaçamento, e stack de implementação (shadcn/ui + Tailwind + Phosphor Icons).

**Quando usar**:
- Estabelecer identidade visual e direção estética
- Decisões criativas de design (fontes, cores inusitadas)
- Crítica de design e auditorias visuais

**Instalação avançada** (mais 12 skills de design):
```
/plugin marketplace add bencium/bencium-claude-code-design-skill
/plugin install bencium-innovative-ux-designer@bencium-marketplace
```

---

### 7. AccessLint

**Fonte**: [accesslint/claude-marketplace](https://github.com/accesslint/claude-marketplace)
**Arquivo**: `.claude/skills/accesslint/SKILL.md`
**Prioridade**: 2 (obrigatória para UI)

**Função**: Toolkit de acessibilidade WCAG 2.2 AA. Dois modos: Report (sem edições, relatório priorizado) e Fix (auditoria + aplicação de correções mecânicas + TODOs para problemas visuais).

**Quando usar**:
- **Sempre antes de entregar qualquer UI**
- "Audita acessibilidade"
- "Verifica a11y"
- "Revisa para WCAG"
- Antes de qualquer merge que toque UI

**Instalação avançada** (live page auditing):
```
/plugin marketplace add accesslint/claude-marketplace
/plugin install accesslint:audit@accesslint-marketplace
```

---

### 8. Vercel React Native Skills

**Fonte**: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills)
**Arquivo**: `.claude/skills/vercel-react-native/SKILL.md`
**Prioridade**: 8 (apenas para mobile)

**Função**: Boas práticas de React Native e Expo para performance, animações, navegação e UI. Cobre FlashList, Reanimated, Expo Image, StyleSheet, SafeAreaView.

**Quando usar**: **APENAS para código React Native / Expo / mobile.**
**Não usar**: Em projetos web Next.js sem componentes mobile.

---

### 9. Document Skills

**Fonte**: Built-in Claude Code (`anthropic-skills:docx`, `anthropic-skills:pdf`, `anthropic-skills:pptx`, `anthropic-skills:xlsx`)
**Prioridade**: 6 (documentação)

**Função**: Criar e manipular documentos Word, PDF, PowerPoint e Excel. Também cobre criação de READMEs, docs técnicas, ADRs e guias de uso.

**Quando usar**:
- Criar ou atualizar README
- Documentar decisões arquiteturais
- Gerar specs técnicas
- Criar documentação de onboarding

**Como ativar**: Disponível via `Skill tool` no Claude Code como `anthropic-skills:docx`, `anthropic-skills:pdf`, etc.

---

### 10. Trail of Bits Security

**Fonte**: [trailofbits/skills](https://github.com/trailofbits/skills)
**Arquivo**: `.claude/skills/trail-of-bits-security/SKILL.md`
**Prioridade**: 1 (MÁXIMA — segurança vence sempre)

**Função**: Auditoria de segurança e detecção de vulnerabilidades. Cobre OWASP Top 10, supply chain risks, análise estática, falhas de autenticação. Inclui checklist específico para Next.js/React.

**Quando usar**:
- Implementando autenticação ou autorização
- Lidando com entrada do usuário
- Fazendo chamadas de API ou processando respostas
- Armazenando dados sensíveis
- Qualquer "revisão de segurança"
- Auditando dependências

**Instalação avançada** (static analysis, SARIF, variant analysis):
```
/plugin marketplace add trailofbits/skills
/plugin install static-analysis@trailofbits-skills
/plugin install differential-review@trailofbits-skills
/plugin install supply-chain-risk-auditor@trailofbits-skills
```

---

### 11. Skill Creator

**Fonte**: Built-in Claude Code (`anthropic-skills:skill-creator`) + local
**Arquivo**: `.claude/skills/skill-creator/SKILL.md`
**Prioridade**: 7

**Função**: Meta-skill para criar, modificar, testar e empacotar novas skills. Documenta estrutura de SKILL.md, boas práticas para descriptions, template de criação.

**Quando usar**:
- Criar uma nova skill do zero
- Melhorar um SKILL.md existente
- Testar se uma skill está ativando corretamente
- Empacotar skills para compartilhar

---

### 12. Webapp Testing

**Fonte**: [anthropics/skills](https://github.com/anthropics/skills)
**Arquivo**: `.claude/skills/webapp-testing/SKILL.md`
**Prioridade**: 5

**Função**: Testes automatizados de aplicações web com Playwright. Cobre testes de fluxo crítico, estados de componente, acessibilidade, responsividade e regressão visual.

**Quando usar**:
- Escrever testes e2e para fluxos críticos
- Debugar comportamento de UI
- Verificar acessibilidade em app rodando
- Checar responsividade em múltiplos viewports
- Smoke testing pós-deploy

---

### 13. Remotion Best Practices

**Fonte**: [wyn-twotabs/claude-skills](https://github.com/wyn-twotabs/claude-skills/tree/main/skills/remotion-best-practices)
**Arquivo**: `.claude/skills/remotion-best-practices/SKILL.md`
**Prioridade**: 9 (apenas para vídeo)

**Função**: Melhores práticas para criação de vídeos programáticos com Remotion (React). Cobre composições, timing baseado em frames, animações com spring/interpolate, media assets, áudio/TTS, 3D, gráficos.

**Quando usar**: **APENAS para projetos Remotion, motion graphics ou geração de vídeo.**
**Não usar**: Em componentes web ou mobile sem relação a vídeo.

---

### 14. Superpowers

**Fonte**: [obra/superpowers](https://github.com/obra/superpowers)
**Arquivo**: `.claude/skills/superpowers/SKILL.md`
**Prioridade**: 10 (auxiliar de metodologia)

**Função**: Framework completo de desenvolvimento agentico. Cobre: brainstorming estruturado, planejamento de implementação, TDD (RED-GREEN-REFACTOR), debuggging em 4 fases, coordenação de agentes paralelos via git worktrees, code review.

**Quando usar**:
- Features complexas que precisam de planejamento estruturado
- Fluxos TDD
- Coordenação de múltiplos agentes
- Debugging sistemático

**Instalação completa**:
```
/plugin install superpowers@claude-plugins-official
```

---

### 15. GStack

**Fonte**: [garrytan/gstack](https://github.com/garrytan/gstack)
**Arquivo**: `.claude/skills/gstack/SKILL.md`
**Prioridade**: 10 (auxiliar de produtividade)

**Função**: Transforma Claude Code em um time de engenharia completo com 23 slash-commands especializados: CEO, designer, eng manager, QA, security auditor, doc engineer, etc.

**Quando usar**:
- Revisões estratégicas de produto (`/plan-ceo-review`)
- Consultorias de design (`/design-consultation`)
- Gates de qualidade (`/review`, `/qa`)
- Auditorias de segurança (`/cso`)
- Workflows de deploy (`/ship`)

**Instalação**:
```bash
git clone https://github.com/garrytan/gstack ~/.gstack
cd ~/.gstack && ./install.sh
```

---

### 16. Firecrawl

**Fonte**: [firecrawl/firecrawl-mcp-server](https://github.com/firecrawl/firecrawl-mcp-server)
**Arquivo**: `.claude/skills/firecrawl/SKILL.md`
**Config**: `.claude/settings.json` (MCP Server)
**Prioridade**: 11 (crawling externo)

**Função**: Scraping e crawling web via MCP. Oferece: scrape de URL única, crawl de domínio completo, mapeamento de sitemap, busca web, extração de dados estruturados.

**Quando usar**: **APENAS para coletar, auditar ou transformar conteúdo externo da web.**
**Não usar**: Para tarefas internas do projeto.

**Configuração necessária**:
1. Obter API key em [firecrawl.dev/app/api-keys](https://www.firecrawl.dev/app/api-keys)
2. Editar `.claude/settings.json` e substituir `SUBSTITUA_PELA_SUA_CHAVE_FIRECRAWL`

---

## Estrutura de Arquivos

```
aditiva-pronto/
├── CLAUDE.md                        ← Regras de prioridade + configuração
├── SKILLS.md                        ← Esta documentação
└── .claude/
    ├── settings.json                ← MCP Firecrawl + permissões
    └── skills/
        ├── frontend-design/
        │   └── SKILL.md
        ├── vercel-react-best-practices/
        │   └── SKILL.md
        ├── vercel-web-design-guidelines/
        │   └── SKILL.md
        ├── vercel-composition-patterns/
        │   └── SKILL.md
        ├── vercel-react-native/
        │   └── SKILL.md
        ├── ui-ux-pro-max/
        │   └── SKILL.md
        ├── bencium-ux-designer/
        │   └── SKILL.md
        ├── accesslint/
        │   └── SKILL.md
        ├── trail-of-bits-security/
        │   └── SKILL.md
        ├── skill-creator/
        │   └── SKILL.md
        ├── webapp-testing/
        │   └── SKILL.md
        ├── remotion-best-practices/
        │   └── SKILL.md
        ├── superpowers/
        │   └── SKILL.md
        ├── gstack/
        │   └── SKILL.md
        └── firecrawl/
            └── SKILL.md
```

---

## Conflitos Conhecidos e Resoluções

| Conflito | Skills Envolvidas | Resolução |
|----------|-------------------|-----------|
| Fonte experimental vs. Performance | Bencium + Frontend Design vs. Vercel Best Practices | Avaliar impacto LCP. Se > 200ms, usar subset de fonte. |
| Animação criativa vs. Acessibilidade | Frontend Design vs. AccessLint | Sempre adicionar `prefers-reduced-motion`. |
| Bundle size vs. Design elaborado | Vercel Best Practices vs. UI/UX Pro Max | Lazy load componentes pesados de design. |
| Mobile patterns vs. Web | React Native vs. Vercel Web | Usar skill correta para cada plataforma. |
| GStack `/cso` vs. Trail of Bits | GStack vs. Trail of Bits Security | Trail of Bits tem prioridade em auditorias de segurança. |
| Creatividade vs. Consistência | Anthropic Frontend Design vs. UI/UX Pro Max | Preferir consistência. Criatividade dentro do sistema de design. |
| Remotion vs. Web animations | Remotion vs. Frontend Design | Remotion apenas para vídeo programático. Framer Motion para web. |

---

## Próximos Passos

1. **Obrigatório**: Configurar API key do Firecrawl em `.claude/settings.json`
2. **Recomendado**: Instalar plugins avançados Trail of Bits e AccessLint (ver comandos em `CLAUDE.md`)
3. **Opcional**: Instalar Superpowers completo via `/plugin install superpowers@claude-plugins-official`
4. **Opcional**: Instalar GStack via `git clone https://github.com/garrytan/gstack`
