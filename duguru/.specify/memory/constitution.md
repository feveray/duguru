# duGuru Constitution

## Core Principles

### I. Theming Dual Obrigatório (Dark / Light Mode)
O suporte a dark e light mode **não é opcional**: toda interface deve funcionar corretamente em ambos os temas desde o início do desenvolvimento.

- Utilizar CSS custom properties (tokens de design) como única fonte de verdade para cores, sombras e elevações.
- A preferência do sistema operacional (`prefers-color-scheme`) deve ser respeitada como valor padrão; o usuário pode sobrescrever a qualquer momento e a escolha deve ser persistida (localStorage ou perfil autenticado).
- Nenhum valor de cor pode ser *hard-coded* em componentes — toda cor deve referenciar um token do tema ativo.
- Testes visuais de regressão devem cobrir snapshot de cada componente nos dois temas.

### II. Mobile-First (NON-NEGOTIABLE)
Toda funcionalidade é desenhada e implementada primeiro para telas móveis (≥ 320 px), depois expandida para breakpoints maiores.

- Breakpoints oficiais: `sm` 480 px · `md` 768 px · `lg` 1024 px · `xl` 1280 px.
- Layouts devem usar CSS Grid e Flexbox; unidades relativas (`rem`, `%`, `vw/vh`) são obrigatórias — valores absolutos em `px` só são permitidos para bordas e sombras.
- Touch targets mínimos: 44 × 44 px (WCAG 2.5.8).
- Nenhuma funcionalidade pode ser exclusiva de desktop; recursos avançados em telas maiores são *progressive enhancements*.
- Todas as páginas devem passar no teste de usabilidade mobile do Lighthouse com pontuação ≥ 90.

### III. Autenticação Segura com JWT
A camada de autenticação deve ser robusta, stateless e auditável.

- Tokens de acesso: JWT assinados com RS256 (chave assimétrica), validade máxima de **15 minutos**.
- Tokens de atualização: armazenados em cookie `HttpOnly; Secure; SameSite=Strict`, validade máxima de **7 dias**.
- Nunca armazenar JWT de acesso em `localStorage` ou `sessionStorage`.
- Rotação automática de refresh token a cada uso (Refresh Token Rotation).
- Revogação de tokens suportada via deny-list em Redis.
- Claims obrigatórios: `sub`, `iat`, `exp`, `jti` (para revogação), `roles`.
- Autenticação multifator (TOTP / passkey) deve ser suportada pela arquitetura desde o início, mesmo que ativada em fase posterior.
- Todas as rotas protegidas devem retornar **401** (não autenticado) ou **403** (não autorizado) com corpo JSON padronizado.

### IV. Cálculos Astronômicos via Swiss Ephemeris (NON-NEGOTIABLE)
A precisão dos cálculos é a principal proposta de valor do produto — erros aqui são falhas críticas.

- Toda computação de posições planetárias, casas astrológicas, aspectos e pontos sensíveis deve usar a biblioteca **Swiss Ephemeris** (via binding Node.js `swisseph` ou wrapper WASM equivalente).
- Os arquivos de efemérides (`.se1`) devem cobrir o intervalo mínimo de 1800 a 2400, servidos de storage imutável e verificados por hash SHA-256 na inicialização do servidor.
- Todos os cálculos devem especificar explicitamente: coordenadas geográficas, fuso horário (tz database), sistema de casas (padrão: Placidus, configurável por usuário) e True Node vs Mean Node.
- O módulo de cálculo astro deve ser **100% puro e isolado** (sem I/O, sem efeitos colaterais), exposto como biblioteca interna testável independentemente.
- Tolerância de erro aceitável: < 0.001° para posições planetárias.
- Resultados devem ser cacheados (Redis) com chave composta por `{data_utc}:{latitude}:{longitude}:{sistema_casas}` e TTL de 24 horas.

### V. TypeScript Estrito (NON-NEGOTIABLE)
Todo código da aplicação (frontend e backend) deve ser escrito em TypeScript com configuração máxima de rigor.

- `tsconfig.json` obrigatório: `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`, `"noImplicitReturns": true`, `"noFallthroughCasesInSwitch": true`.
- Proibido o uso de `any` — use `unknown` e faça narrowing explícito; exceções documentadas com comentário `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + justificativa.
- Proibido o uso de `as` (type assertion) sem guard de runtime precedendo.
- Interfaces públicas de módulos devem ter JSDoc com descrição, `@param`, `@returns` e `@throws`.
- Tipos gerados automaticamente (Prisma, OpenAPI, GraphQL) são permitidos mas devem ser mantidos em diretórios separados e nunca editados manualmente.
- ESLint com `@typescript-eslint/recommended-type-checked` é parte do pipeline de CI e falhas bloqueiam o merge.

### VI. Cobertura de Testes ≥ 80% (NON-NEGOTIABLE)
Qualidade é verificável e não depende de boa intenção.

- Cobertura mínima global: **80%** para linhas, branches, funções e statements.
- Cobertura do módulo de cálculo astronômico: **100%** (módulo crítico).
- Cobertura das rotas de autenticação: **95%**.
- Stack de testes: **Vitest** (unit/integration), **Playwright** (E2E), **Testing Library** (componentes React).
- TDD obrigatório para: módulo astronômico, autenticação, regras de negócio astrológico (interpretações, aspectos).
- Testes E2E devem cobrir fluxos críticos: cadastro → login → geração de mapa natal → compartilhamento.
- Relatório de cobertura exportado para Codecov em todo PR; PRs que reduzam a cobertura são bloqueados automaticamente.
- Mocks de Swiss Ephemeris devem usar fixtures derivadas de dados reais, não valores inventados.

### VII. Performance — LCP < 2.5 s (NON-NEGOTIABLE)
Velocidade é funcionalidade, especialmente em mercados mobile com conectividade variável.

- LCP (Largest Contentful Paint) ≤ **2.5 s** em conexão 4G simulada (Lighthouse throttling).
- FID / INP ≤ **200 ms**; CLS ≤ **0.1**.
- Estratégia de renderização: SSR + Streaming (React Server Components ou equivalente) para páginas públicas; CSR apenas para dashboard autenticado com dados em tempo real.
- Code splitting obrigatório: cada rota carrega apenas seus próprios chunks — bundle inicial ≤ **150 KB** gzippado.
- Imagens: formato WebP/AVIF, `srcset` obrigatório, lazy-loading nativo (`loading="lazy"`) exceto LCP candidate.
- Fontes: `font-display: swap`, preload de subset crítico (latin + latin-ext para PT-BR).
- O módulo WASM do Swiss Ephemeris deve ser carregado de forma lazy e não pode bloquear o thread principal.
- Auditorias Lighthouse automatizadas no CI com baseline salvo por commit — regressões > 5 pontos bloqueiam merge.

### VIII. Acessibilidade WCAG 2.1 AA (NON-NEGOTIABLE)
O duGuru deve ser utilizável por pessoas com qualquer tipo de deficiência.

- Conformidade mínima: **WCAG 2.1 nível AA** em todas as páginas e fluxos.
- Contraste mínimo de cores: **4.5:1** para texto normal; **3:1** para texto grande e componentes UI — verificado em ambos os temas.
- Navegação completa via teclado: foco visível, ordem lógica de tab, sem armadilhas de foco.
- Todos os elementos interativos devem ter rótulo acessível (`aria-label`, `aria-labelledby` ou texto visível associado).
- Gráficos do mapa astrológico (SVG) devem ter alternativa textual estruturada (tabela de posições + `role="img"` + `aria-describedby`).
- Testes automatizados com **axe-core** integrado ao Playwright; zero violações de nível A ou AA permitidas no CI.
- Testes manuais com leitores de tela (NVDA / VoiceOver) obrigatórios antes de cada release.
- Componentes de modal e drawer devem implementar padrão ARIA `dialog` completo (foco preso, `aria-modal`, `Escape` para fechar).

### IX. Internacionalização — PT-BR como padrão, i18n-ready
O produto é lançado em português do Brasil; a arquitetura deve suportar novos idiomas sem refatoração.

- Biblioteca de i18n: **next-intl** (ou equivalente) configurada desde o primeiro componente.
- Nenhuma string visível ao usuário pode ser *hard-coded* em componentes — toda cópia deve residir em arquivos de mensagens (`/messages/pt-BR.json`, etc.).
- Locale padrão: `pt-BR`; fallback: `en-US`.
- Formato de datas, horas, números e moedas deve usar `Intl.*` APIs com locale explícito — nunca `toLocaleDateString()` sem argumento.
- Nomes de planetas, signos, casas e aspectos devem ter traduções centralizadas no sistema de mensagens (não em constantes de código).
- Direção de texto (LTR/RTL) deve ser considerada na estrutura de layout, mesmo que RTL não seja suportado no lançamento.
- Extração automatizada de chaves de i18n no CI deve alertar sobre strings não traduzidas.

---

## Stack de Tecnologia Referência

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15+ (App Router), React 19+, Tailwind CSS v4 |
| Linguagem | TypeScript 5.x (strict) |
| Backend | Next.js Route Handlers / Node.js (se serviço separado) |
| Autenticação | JWT RS256 + cookie HttpOnly (biblioteca: `jose`) |
| Astronomia | Swiss Ephemeris (`swisseph` ou WASM port) |
| Banco de dados | PostgreSQL + Prisma ORM |
| Cache | Redis (Upstash em produção) |
| Testes | Vitest + Testing Library + Playwright |
| Deploy | Vercel (frontend) + Railway/Fly.io (serviços backend) |
| CI/CD | GitHub Actions |
| Monitoramento | Sentry (errors) + Vercel Analytics / Web Vitals |

---

## Qualidade e Workflow de Desenvolvimento

### Gates de CI Obrigatórios (todo PR)

1. `tsc --noEmit` — zero erros de tipo.
2. ESLint `@typescript-eslint/recommended-type-checked` — zero warnings tratados como erros.
3. Vitest — cobertura ≥ 80% global (100% no módulo astro).
4. Playwright E2E — fluxos críticos passando.
5. axe-core — zero violações A/AA.
6. Lighthouse CI — LCP ≤ 2.5 s, Performance ≥ 85, Accessibility ≥ 95.
7. Bundle size check — chunk inicial ≤ 150 KB gzip.

### Branching

- `main` — produção; protegido, merge via PR com ≥ 1 aprovação.
- `develop` — integração contínua.
- Feature branches: `feat/<slug>`, fix: `fix/<slug>`, hotfix: `hotfix/<slug>`.
- Commits seguem **Conventional Commits** (`feat:`, `fix:`, `perf:`, `a11y:`, `i18n:`, `test:`, `chore:`).

### Versionamento

Segue **Semantic Versioning** (MAJOR.MINOR.PATCH); changelog gerado automaticamente via `release-please` ou equivalente.

---

## Governança

- Esta constituição supersede qualquer outra convenção de código, README ou decisão de arquitetura não documentada.
- Qualquer emenda exige: proposta escrita → revisão de pelo menos um maintainer → atualização da versão do documento → registro da data de emenda.
- Todo PR deve verificar conformidade com cada princípio aplicável antes de solicitar revisão.
- Violações intencionais devem ser documentadas como ADR (Architecture Decision Record) com justificativa, impacto e plano de remediação.
- Dívida técnica que viole qualquer princípio NON-NEGOTIABLE deve ser registrada como issue de alta prioridade e resolvida na sprint seguinte.

---

**Version**: 1.0.0 | **Ratified**: 2026-02-24 | **Last Amended**: 2026-02-24
