# Tasks: duGuru — Aplicativo Web de Astrologia Pessoal

**Input**: Design documents from `/specs/001-duguru-app/`  
**Prerequisites**: [spec.md](./spec.md) ✅ | [plan.md](./plan.md) ✅  
**Branch**: `001-duguru-app`  
**Created**: 2026-02-24

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências entre si)
- **[Story]**: User story de origem (US1–US8, INFRA)
- Caminhos relativos à raiz do repositório (`duguru/`)

---

## Phase 1: Setup — Monorepo e Fundação de Tooling

**Purpose**: Estrutura de pastas, configuração de TypeScript strict, linting e CI básico. Sem features — todos os outros trabalhos dependem desta fase.

- [x] T001 [INFRA] Criar estrutura de diretórios `frontend/` e `backend/` conforme plan.md
- [x] T002 [P] [INFRA] Inicializar `frontend/package.json` com React 18, Vite 5, TypeScript, Tailwind CSS v3, react-router-dom v6, zustand, framer-motion, axios, react-i18next, react-helmet-async, vite-plugin-pwa
- [x] T003 [P] [INFRA] Inicializar `backend/package.json` com Express 4, TypeScript, sweph, Prisma, jose, bcrypt, nodemailer, sharp, puppeteer, express-rate-limit, cors, helmet
- [x] T004 [P] [INFRA] Configurar `frontend/tsconfig.json` com `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitReturns: true`
- [x] T005 [P] [INFRA] Configurar `backend/tsconfig.json` com mesmas flags strict
- [x] T006 [P] [INFRA] Configurar ESLint + Prettier em `frontend/` (`@typescript-eslint/recommended-type-checked`)
- [x] T007 [P] [INFRA] Configurar ESLint + Prettier em `backend/` (`@typescript-eslint/recommended-type-checked`)
- [x] T008 [P] [INFRA] Configurar Tailwind CSS v3 em `frontend/tailwind.config.ts` com `darkMode: 'class'` e `theme.extend` vazio (tokens virão no T009)
- [x] T009 [INFRA] Criar `frontend/src/styles/globals.css` com todos os CSS custom properties da paleta duGuru (light e dark) conforme design system do plan.md — nenhum valor de cor fora deste arquivo
- [x] T010 [P] [INFRA] Criar `frontend/src/styles/tailwind.css` mapeando `theme.extend.colors` para as CSS variables
- [x] T011 [P] [INFRA] Configurar Vitest em `frontend/vitest.config.ts` com cobertura (thresholds: lines 80, branches 80, functions 80, statements 80)
- [x] T012 [P] [INFRA] Configurar Vitest em `backend/vitest.config.ts` (thresholds: global 80%, módulo astro 100%, rotas auth 95%)
- [x] T013 [P] [INFRA] Configurar Playwright em `frontend/playwright.config.ts` (browsers: chromium, firefox, webkit; viewport mobile 375×812)
- [x] T014 [P] [INFRA] Criar `frontend/.env.example` e `backend/.env.example` com todas as variáveis necessárias documentadas (sem valores reais)
- [x] T015 [P] [INFRA] Criar `.github/workflows/ci-frontend.yml` (lint → type-check → vitest com cobertura → playwright E2E)
- [x] T016 [P] [INFRA] Criar `.github/workflows/ci-backend.yml` (lint → type-check → vitest com cobertura)
- [x] T017 [INFRA] Criar `frontend/src/i18n/index.ts` (configuração react-i18next, locale padrão pt-BR) e `frontend/src/i18n/messages/pt-BR.json` (arquivo vazio com estrutura de namespaces)
- [x] T018 [P] [INFRA] Criar componentes UI primitivos em `frontend/src/components/ui/`: `Button.tsx`, `Input.tsx`, `Skeleton.tsx`, `Toast.tsx`, `Modal.tsx` — usando CSS variables do tema, sem cores hardcoded
- [x] T019 [P] [INFRA] Criar `frontend/src/components/layout/TopBar.tsx` e `frontend/src/router.tsx` (React Router v6, rotas protegidas com `<ProtectedRoute>`)

**Checkpoint**: `npm run lint`, `npm run type-check` e `npm run test` passam em ambos os projetos. CI verde no PR inicial.

---

## Phase 2: Fundação — Banco de Dados e Middlewares

**Purpose**: PostgreSQL, schema Prisma, middleware Auth e Error Handler. Bloqueia todas as user stories.

**⚠️ CRÍTICO**: Nenhuma user story pode começar antes desta fase estar completa.

- [x] T020 [INFRA] Criar `backend/src/db/prisma/schema.prisma` com todos os modelos do plan.md: `User`, `RefreshToken`, `NatalChartCache`, `DailyContent`, `CompatibilityScore`
- [x] T021 [INFRA] Executar `prisma migrate dev --name init` e confirmar migração aplicada no banco de dev (Railway)
- [x] T022 [P] [INFRA] Criar `backend/src/middleware/errorHandler.ts` — formato de erro padrão `{ error: { code, message, status } }` para todos os erros da API
- [x] T023 [P] [INFRA] Criar `backend/src/middleware/requestLogger.ts` — log estruturado (JSON) de método, rota, status, latência
- [x] T024 [P] [INFRA] Criar `backend/src/middleware/rateLimiter.ts` — `express-rate-limit`: janela 15 min, máx 5 tentativas para rotas de login
- [x] T025 [INFRA] Criar `backend/src/app.ts` — Express app factory com `helmet`, `cors`, `express.json`, todos os middlewares e routers registrados
- [x] T026 [P] [INFRA] Gerar par de chaves RSA (4096 bits) para JWT RS256; documentar processo em `backend/README.md`; adicionar `RSA_PRIVATE_KEY` e `RSA_PUBLIC_KEY` ao `.env.example`
- [x] T027 [P] [INFRA] Criar `backend/src/auth/jwtService.ts` — `signAccessToken`, `signRefreshToken`, `verifyAccessToken`, `verifyRefreshToken` usando `jose` com RS256
- [x] T028 [P] [INFRA] Criar `backend/src/auth/passwordService.ts` — `hashPassword`, `verifyPassword` com bcrypt (rounds: 12)
- [x] T029 [INFRA] Criar `backend/src/auth/authMiddleware.ts` — extrai e valida JWT do header `Authorization: Bearer`, retorna 401 padronizado se inválido
- [x] T030 [P] [INFRA] Criar `frontend/src/services/api.ts` — axios instance com `baseURL`, interceptor de request (injeta Authorization header), interceptor de response (auto-refresh em 401 via `/api/auth/refresh`, retry original request)
- [x] T031 [P] [INFRA] Criar `frontend/src/stores/authStore.ts` (Zustand) — estado: `user`, `isAuthenticated`; actions: `setUser`, `logout`; persistência do `user` em localStorage (exceto tokens)

**Checkpoint**: Banco migrado. `POST /api/auth/login` (sem implementação ainda) retorna 404 estruturado. Middleware de auth retorna 401 para token ausente. CI verde.

---

## Phase 3: US6 + US1 — Autenticação, Cadastro e Perfil (P1) 🎯 MVP

**Goal**: Usuário pode criar conta, fazer login, recuperar senha e editar perfil. Sem este bloco nenhuma outra feature funciona.

**Independent Test**: Abrir `/cadastro` → preencher formulário → ser redirecionado para `/` (home). Abrir `/login` → autenticar → acessar `/perfil`.

### Testes — Auth (escrever ANTES da implementação, devem FALHAR primeiro)

- [x] T032 [P] [US6] Teste unitário `backend/tests/unit/auth/jwtService.test.ts` — sign/verify access token, sign/verify refresh token, token expirado, assinatura inválida
- [x] T033 [P] [US6] Teste unitário `backend/tests/unit/auth/passwordService.test.ts` — hash, verify correto, verify incorreto
- [x] T034 [P] [US6] Teste de integração `backend/tests/integration/auth.routes.test.ts` — register (sucesso, email duplicado, campos inválidos), login (sucesso, credenciais erradas, rate limit), refresh, logout, forgot-password, reset-password
- [x] T035 [US6] Teste E2E `frontend/tests/e2e/auth.spec.ts` — cadastro completo → login → logout → recuperação de senha (fluxo happy-path + erros)

### Implementação — Backend Auth

- [x] T036 [US6] Criar `backend/src/auth/tokenStore.ts` — `saveRefreshToken`, `revokeRefreshToken`, `isTokenRevoked`, `rotateRefreshToken` (Refresh Token Rotation via tabela `RefreshToken`)
- [x] T037 [US6] Criar `backend/src/routes/auth.routes.ts` com os 6 endpoints: `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `POST /forgot-password`, `POST /reset-password`
- [x] T038 [US6] Implementar handler `POST /register` — validar campos (email RFC 5322, senha ≥ 8 chars + 1 maiúscula + 1 número), criar `User` no Prisma, emitir access token + refresh token (cookie HttpOnly)
- [x] T039 [US6] Implementar handler `POST /login` — verificar credentials, aplicar rate limit (T024), emitir tokens; bloquear conta por 15 min após 5 falhas consecutivas; notificar por email no bloqueio
- [x] T040 [US6] Implementar handler `POST /refresh` — ler cookie HttpOnly, verificar token, aplicar Refresh Token Rotation, emitir novo par de tokens
- [x] T041 [US6] Implementar handler `POST /logout` — revogar refresh token na tabela; limpar cookie
- [x] T042 [US6] Implementar handlers `POST /forgot-password` e `POST /reset-password` — gerar link com token UUID válido por 1 hora, 1 link ativo por conta, enviar via `emailService`
- [x] T043 [P] [US6] Criar `backend/src/services/emailService.ts` — nodemailer + SMTP; templates: recuperação de senha, bloqueio de conta, envio de mapa astral
- [x] T044 [P] [US1] Criar `backend/src/routes/profile.routes.ts` com `GET /profile`, `PATCH /profile`, `POST /profile/avatar`
- [x] T045 [US1] Implementar `PATCH /profile` — atualizar campos do `User`; se `birthDate`, `birthLat`, `birthLon` ou `houseSystem` mudarem, invalidar `NatalChartCache` do usuário
- [x] T046 [US1] Implementar `POST /profile/avatar` — multer para upload, sharp para crop circular, salvar URL no `User.avatarUrl`
- [x] T047 [P] [US1] Criar `backend/src/routes/geocoding.routes.ts` com `GET /geocoding/search?q=`
- [x] T048 [US1] Implementar `backend/src/services/geocodingService.ts` — chamar OpenCage API; fallback para Nominatim (OpenStreetMap) se OpenCage falhar ou cota esgotada; retornar `{ city, country, lat, lon, timezone }`

### Implementação — Frontend Auth

- [x] T049 [US6] Criar `frontend/src/pages/WelcomePage.tsx` — logo duGuru, mascote, botões "Entrar" e "Criar Conta"; meta tags SEO dinâmicas via react-helmet-async
- [x] T050 [US6] Criar `frontend/src/pages/LoginPage.tsx` + `frontend/src/components/auth/LoginForm.tsx` — email + senha, link "Esqueci minha senha", toast em caso de erro
- [x] T051 [US6] Criar `frontend/src/pages/RegisterPage.tsx` + `frontend/src/components/auth/RegisterForm.tsx` — todos os campos (nome, email, senha, data nascimento, local com autocomplete, horário), validação em tempo real, toggle "Não sei o horário"
- [x] T052 [US1] Criar autocomplete de cidade `frontend/src/components/auth/BirthPlaceInput.tsx` — debounce de 300 ms, chama `/api/geocoding/search`, exibe lista (máx 8) com cidade + país + bandeira; Escape fecha a lista; a11y: `role="combobox"`, `aria-activedescendant`
- [x] T053 [US6] Criar `frontend/src/pages/ForgotPasswordPage.tsx` + `frontend/src/components/auth/ForgotPasswordForm.tsx` e `ResetPasswordForm.tsx`
- [x] T054 [US6] Criar `frontend/src/services/authService.ts` — `register`, `login`, `logout`, `refresh`, `forgotPassword`, `resetPassword`
- [x] T055 [US6] Criar `frontend/src/hooks/useAuth.ts` — wraps zustand `authStore` + `authService`; expõe `login`, `logout`, `register`
- [x] T056 [US1] Criar `frontend/src/pages/ProfilePage.tsx` + `frontend/src/components/profile/ProfileForm.tsx` e `AvatarUpload.tsx` — crop circular, preview antes de salvar, limite 5 MB com mensagem de erro

**Checkpoint**: Fluxo completo cadastro → login → logout → recuperação de senha funcionando. E2E passando. Cobertura backend auth ≥ 95%.

---

## Phase 4: US2 — Mapa Astral / Natal Chart (P1) 🎯 MVP

**Goal**: Usuário autenticado vê mandala SVG interativa com posições planetárias calculadas, tabela de posições e interpretações. LCP ≤ 2.5 s.

**Independent Test**: Usuário autenticado acessa `/mapa-natal` → vê mandala → clica em planeta → vê interpretação. Posições validadas contra fixture de referência (Astro.com).

### Testes — Módulo Astronômico (cobertura 100% obrigatória — escrever ANTES)

- [x] T057 [US2] Teste unitário `backend/tests/unit/astro/ephemeris.test.ts` — validar posições dos 10 planetas para 3 datas de referência (fixtures derivadas do Astro.com); tolerância < 0.001°
- [x] T058 [P] [US2] Teste unitário `backend/tests/unit/astro/moonPhase.test.ts` — validar fase lunar para 12 datas conhecidas
- [x] T059 [P] [US2] Teste unitário `backend/tests/unit/astro/transits.test.ts` — validar trânsitos ativos para data de referência
- [x] T060 [P] [US2] Teste unitário `backend/tests/unit/astro/synastry.test.ts` — validar aspectos entre dois mapas de referência
- [x] T061 [US2] Teste de integração `backend/tests/integration/chart.routes.test.ts` — GET natal (cache miss → calcula, cache hit → retorna cache), download PDF, envio por email
- [x] T062 [US2] Teste E2E `frontend/tests/e2e/natalChart.spec.ts` — login → /mapa-natal → mandala visível → clicar planeta → ver painel → baixar PNG

### Implementação — Backend Astro (módulo puro, ZERO I/O)

- [x] T063 [US2] Criar `backend/src/astro/ephemeris.ts` — wrapper puro sobre `sweph`; funções: `calcPlanet(jd, planet): PlanetPosition`, `calcHouses(jd, lat, lon, system): HouseData`, `calcAspects(positions): Aspect[]`; nenhum I/O, nenhum efeito colateral; tipos TypeScript strict para todos os retornos
- [x] T064 [US2] Criar `backend/src/astro/moonPhase.ts` — `getMoonPhase(jd): MoonPhaseData { name, illumination, nextNewMoon, nextFullMoon }`; puro, sem I/O
- [x] T065 [US2] Criar `backend/src/astro/transits.ts` — `getActiveTransits(jd, natalPositions): Transit[]`; puro, sem I/O
- [x] T066 [US2] Criar `backend/src/astro/synastry.ts` — `calcSynastryAspects(map1, map2): SynastryAspect[]`; orbes diferenciados por classe planetária (8°/6°/4°); puro, sem I/O
- [x] T067 [US2] Criar `backend/src/astro/interpretationProvider.ts` — interface `InterpretationProvider` + implementação `CuratedInterpretationProvider` que lê os JSONs curados; sem I/O em produção (JSONs carregados na inicialização do processo)
- [x] T068 [P] [US2] Criar `backend/src/astro/interpretations/planets-in-signs.json` — estrutura `{ "sun_aries": "texto...", ... }` (120 combinações: 10 planetas × 12 signos); placeholder inicial com textos marcados `[TODO: copywriting]`
- [x] T069 [P] [US2] Criar `backend/src/astro/interpretations/planets-in-houses.json` — 120 combinações (10 planetas × 12 casas); placeholder inicial
- [x] T070 [US2] Criar `backend/src/services/chartService.ts` — `getNatalChart(userId): NatalChartResult`; converte `birthDate + birthTime + lat + lon` para Julian Day; verifica cache (`NatalChartCache`); se miss: chama `ephemeris.ts`, salva cache com TTL 24 h; monta resposta com posições + interpretações
- [x] T071 [US2] Criar `backend/src/routes/chart.routes.ts` — `GET /natal`, `GET /natal/download?format=pdf|png`, `POST /natal/email`
- [x] T072 [US2] Criar `backend/src/services/pdfService.ts` — Puppeteer headless: renderiza página interna de mapa → captura PDF (A4 paisagem) ou PNG (2000×2000); geração assíncrona retorna 202 + envia arquivo por email; mínimo 30 s de timeout

### Implementação — Frontend Mandala

- [x] T073 [US2] Criar `frontend/src/services/chartService.ts` — `getNatalChart()`, `downloadChart(format)`, `emailChart()`
- [x] T074 [US2] Criar `frontend/src/hooks/useNatalChart.ts` — chama `chartService`, gerencia estado de loading/error com skeleton
- [x] T075 [US2] Criar `frontend/src/lib/svgChart.ts` — funções D3 puras para cálculo de coordenadas: `zodiacWheelPath`, `planetPosition`, `aspectLine`, `houseLines`; zero I/O, 100% testável
- [x] T076 [US2] Criar `frontend/src/components/chart/NatalChartWheel.tsx` — SVG interativo D3; 12 divisões de signos, 12 casas, 10 planetas com glifos, linhas de aspecto coloridas (conjunção: roxo, oposição: vermelho, trígono: azul, quadratura: laranja, sextil: verde); `role="img"`, `aria-describedby` apontando para tabela
- [x] T077 [US2] Criar `frontend/src/components/chart/PlanetPanel.tsx` — painel lateral / popover ao clicar em planeta: nome, símbolo, signo, grau, casa, retrógrado (R), interpretação resumida; animação Framer Motion (`AnimatePresence`)
- [x] T078 [US2] Criar `frontend/src/components/chart/ChartTable.tsx` — tabela acessível com `scope="col"`, `aria-sort`, colunas: ícone, planeta, signo, grau, casa, R; é a alternativa textual do SVG
- [x] T079 [P] [US2] Criar `frontend/src/components/chart/HouseSystemSelector.tsx` — select com opções Placidus, Koch, Whole Sign, Equal, Campanus; dispara refetch do mapa ao mudar
- [x] T080 [US2] Criar `frontend/src/pages/NatalChartPage.tsx` — compõe `NatalChartWheel` + `ChartTable` + `HouseSystemSelector` + botões Download/Email; skeleton screen durante loading; `<Suspense>` para lazy load do módulo D3

**Checkpoint**: `/mapa-natal` com posições corretas (E2E passando, fixtures validadas). LCP ≤ 2.5 s medido com `playwright` + `lighthouse-ci`. Cobertura módulo astro = 100%.

---

## Phase 5: US4 — Dashboard / Home (P2)

**Goal**: Home com planeta do dia, fase lunar, frase inspiradora, alertas de eventos astrológicos e Top 3 compatibilidade.

**Independent Test**: Usuário autenticado acessa `/` → todos os blocos carregam com dados do dia atual.

### Testes — Dashboard

- [x] T081 [US4] Teste de integração `backend/tests/integration/dashboard.routes.test.ts` — GET /daily retorna planeta, fase lunar, frase, alertas, top3 para a data atual
- [x] T082 [US4] Teste E2E `frontend/tests/e2e/dashboard.spec.ts` — login → home → verificar todos os blocos presentes e com conteúdo

### Implementação — Backend Dashboard

- [x] T083 [P] [US4] Criar `backend/src/services/dailyContentService.ts` — `getDailyContent(date, userId): DailyContent`; calcula planeta destaque do dia via trânsitos; recupera fase lunar (`moonPhase.ts`); seleciona frase do dia (índice = dia do ano % 365); lista alertas de eventos astrológicos ativos (retrógrados, eclipses)
- [x] T084 [US4] Criar seed `backend/prisma/seeds/dailyQuotes.ts` — 365 frases inspiradoras em PT-BR; executar `prisma db seed` criar registros em `DailyContent`
- [x] T085 [US4] Criar `backend/src/routes/dashboard.routes.ts` — `GET /api/daily` (requer auth); retorna JSON com todos os blocos para a home
- [x] T086 [P] [US4] Criar seed `backend/prisma/seeds/compatibilityScores.ts` — 144 registros (12×12 signos) com scores romance/amizade/trabalho pré-calculados em `CompatibilityScore`

### Implementação — Frontend Dashboard

- [x] T087 [US4] Criar `frontend/src/pages/HomePage.tsx` — layout de cards mobile-first; compõe todos os blocos; Skeleton screen durante loading
- [x] T088 [P] [US4] Criar `frontend/src/components/dashboard/DailyPlanet.tsx` — ícone do planeta + nome + influência do dia; animação de entrada Framer Motion
- [x] T089 [P] [US4] Criar `frontend/src/components/dashboard/MoonPhase.tsx` — imagem da fase + nome + descrição; ao expandir: data do próximo ciclo + dica prática
- [x] T090 [P] [US4] Criar `frontend/src/components/dashboard/DailyQuote.tsx` — frase do dia com tipografia destacada; troca suavemente (AnimatePresence) quando a data muda
- [x] T091 [P] [US4] Criar `frontend/src/components/dashboard/AlertBanner.tsx` — lista de alertas de eventos; cada card: nome do evento + período + signo + dica; cor de destaque `--color-highlight`
- [x] T092 [P] [US4] Criar `frontend/src/components/dashboard/CompatTop3.tsx` — Top 3 signos mais compatíveis com o signo solar do usuário; ícone + nome + resumo 1 frase; link para `/compatibilidade`

**Checkpoint**: Home exibe todos os blocos corretamente. Alertas de Marte retrógrado (fixture de teste) aparecem durante o período correto.

---

## Phase 6: US3 — Horóscopo Personalizado (P2)

**Goal**: Horóscopo do dia/semana/mês/ano com 5 seções temáticas, baseado em signo solar e ascendente.

**Independent Test**: Usuário autenticado acessa `/horoscopo` → vê horóscopo do dia com 5 seções → troca para "Semana" → conteúdo muda.

### Testes — Horóscopo

- [x] T093 [P] [US3] Teste unitário `backend/tests/unit/astro/transits.test.ts` (complemento T059) — validar que trânsito ativo para Áries em data X seleciona texto correto do banco curado
- [x] T094 [US3] Teste de integração `backend/tests/integration/horoscope.routes.test.ts` — GET /horoscope/day, week, month, year; verificar estrutura de resposta (5 seções)
- [x] T095 [US3] Teste E2E `frontend/tests/e2e/horoscope.spec.ts` — login → /horoscopo → ver 5 seções → trocar período → trocar entre signo solar e ascendente

### Implementação — Backend Horóscopo

- [x] T096 [P] [US3] Criar `backend/src/astro/interpretations/transits-by-sign.json` — estrutura `{ "aries_sun_transit": { "love": "...", "work": "...", "health": "...", "finance": "...", "advice": "..." }, ... }` (600 entradas: 12 signos × 10 planetas × 5 seções); placeholder inicial
- [x] T097 [US3] Criar `backend/src/services/horoscopeService.ts` — `getHoroscope(sign, period, ascendant?): HoroscopeResult`; usa `transits.ts` para obter planetas em trânsito no período; seleciona textos de `transits-by-sign.json`; compõe as 5 seções; cache em memória por 1 hora (Map com chave `{sign}:{period}:{date}`)
- [x] T098 [US3] Criar `backend/src/routes/horoscope.routes.ts` — `GET /api/horoscope/:period` (day|week|month|year); requer auth; opcionalmente aceita `?useAscendant=true`

### Implementação — Frontend Horóscopo

- [x] T099 [US3] Criar `frontend/src/pages/HoroscopePage.tsx` — tabs de período (Hoje/Semana/Mês/Ano); switch Signo Solar / Ascendente; Skeleton durante loading
- [x] T100 [P] [US3] Criar `frontend/src/components/horoscope/PeriodTabs.tsx` — tabs acessíveis (`role="tablist"`, `role="tab"`, `aria-selected`); animação de transição Framer Motion
- [x] T101 [P] [US3] Criar `frontend/src/components/horoscope/SectionBlock.tsx` — card de cada seção (Amor/Trabalho/Saúde/Finanças/Conselho) com ícone e texto; Skeleton se loading
- [x] T102 [US3] Criar `frontend/src/services/horoscopeService.ts` e `frontend/src/hooks/useHoroscope.ts`

**Checkpoint**: Horóscopo do dia exibe 5 seções para o signo do usuário. Troca de período recarrega conteúdo sem flash. Cache previne recálculo em requests consecutivos dentro de 1 hora.

---

## Phase 7: US8 — Onboarding (P2)

**Goal**: Tour guiado de 3–4 passos para novos usuários na primeira sessão.

**Independent Test**: Criar conta nova → onboarding inicia automaticamente → pode ser concluído ou pulado → estado persistido (não reaparece).

### Implementação — Onboarding

- [x] T103 [P] [US8] Criar `frontend/src/stores/onboardingStore.ts` (Zustand) — estado: `isActive`, `currentStep`; actions: `start`, `next`, `skip`, `complete`; sincroniza com `PATCH /api/profile` (`onboardingDone: true`) ao completar ou pular
- [x] T104 [US8] Criar `frontend/src/components/layout/OnboardingOverlay.tsx` — overlay semi-transparente com `AnimatePresence`; 4 passos: Mapa Astral → Horóscopo → Dashboard → Compatibilidade; cada passo: título, descrição (≤ 2 frases), botões "Anterior" / "Próximo" / "Pular"; foco preso no dialog durante o tour (`role="dialog"`, `aria-modal="true"`)
- [x] T105 [US8] Integrar `OnboardingOverlay` em `frontend/src/App.tsx` — inicia automaticamente quando `user.onboardingDone === false` após login/registro

**Checkpoint**: Novo usuário vê onboarding ao primeiro login. Usuário existente NÃO vê onboarding. Tecla Escape ou "Pular" encerra o tour e persiste o estado.

---

## Phase 8: US5 — Compatibilidade e Sinastria (P3)

**Goal**: Página de compatibilidade com score por área e sinastria simplificada entre dois perfis.

**Independent Test**: Acessa `/compatibilidade` → seleciona dois signos → vê scores com barras visuais → insere dados de nascimento para sinastria → vê aspectos.

### Testes — Compatibilidade

- [x] T106 [P] [US5] Teste unitário `backend/tests/unit/astro/synastry.test.ts` (complemento T060) — fixture com mapa A e mapa B conhecidos; verificar aspectos e orbes diferenciados (8°/6°/4°)
- [x] T107 [US5] Teste de integração `backend/tests/integration/compatibility.routes.test.ts` — GET /compatibility?sign1=aries&sign2=leo; POST /synastry com dois conjuntos de dados de nascimento

### Implementação — Backend Compatibilidade

- [x] T108 [US5] Criar `backend/src/routes/compatibility.routes.ts` — `GET /api/compatibility?sign1=&sign2=` (busca `CompatibilityScore`), `POST /api/synastry` (calcula aspectos via `synastry.ts`)
- [x] T109 [US5] Implementar handler `POST /synastry` — aceita dois objetos `{ birthDate, birthTime?, lat, lon }`; calcula posições de ambos via `ephemeris.ts`; calcula aspectos via `synastry.ts`; retorna lista de aspectos com descrição e intensidade

### Implementação — Frontend Compatibilidade

- [x] T110 [US5] Criar `frontend/src/pages/CompatibilityPage.tsx` — seletores de signo (default: signo solar do usuário + seletor livre); seção sinastria com formulário de dados de nascimento do segundo perfil
- [x] T111 [P] [US5] Criar `frontend/src/components/compatibility/CompatScore.tsx` — score geral + 3 barras animadas (Romance/Amizade/Trabalho) com percentual e parágrafo; Framer Motion para animação das barras
- [x] T112 [P] [US5] Criar `frontend/src/components/compatibility/SynastrySummary.tsx` — lista de aspectos entre os dois mapas; cada item: planetas envolvidos, tipo de aspecto (ícone), orbe, influência resumida

**Checkpoint**: Compatibilidade exibe scores corretos para ARIÊS + LEÃO (fixture). Sinastria calcula e exibe mínimo 3 aspectos para par de referência.

---

## Phase 9: US7 — PWA e Offline (P3)

**Goal**: App instalável como PWA; mapa astral e horóscopo acessíveis offline após primeira carga.

**Independent Test**: Abrir app → esperar `networkidle` → desativar rede no Playwright → navegar para `/mapa-natal` e `/horoscopo` → conteúdo visível.

### Implementação — PWA

- [x] T113 [INFRA] Configurar `vite-plugin-pwa` em `frontend/vite.config.ts` — `registerType: 'autoUpdate'`, estratégia Workbox: `NetworkFirst` para chamadas de API (`/api/*`), `CacheFirst` para assets estáticos
- [x] T114 [P] [US7] Criar `frontend/public/manifest.json` — `name: "duGuru"`, `short_name: "duGuru"`, `theme_color: "#004643"` (dark), `background_color: "#faeee7"`, `display: "standalone"`, `start_url: "/"`, ícones 192×192 e 512×512 com o logo bola de cristal
- [x] T115 [P] [US7] Criar ícones PWA em `frontend/public/icons/` — 192×192 e 512×512 px derivados do ícone da bola de cristal
- [x] T116 [US7] Criar `frontend/src/hooks/usePWAInstall.ts` — detecta `BeforeInstallPromptEvent`, expõe `canInstall` e `promptInstall()`; botão "Instalar app" exibido no perfil quando `canInstall === true`
- [x] T117 [US7] Teste E2E `frontend/tests/e2e/pwa.spec.ts` — interceptar service worker, desativar rede, verificar que `/mapa-natal` e `/horoscopo` servem conteúdo cacheado; verificar toast "Esta função requer conexão" para download PDF offline

**Checkpoint**: Lighthouse PWA badge verde. App instalável no Android/Chrome. Mapa e horóscopo funcionam offline.

---

## Phase 10: Polish — SEO, Acessibilidade, Performance e Deploy

**Purpose**: Gates de qualidade obrigatórios, SEO, monitoramento e deploy de produção.

### Navegação e Layout

- [x] T118 [P] [INFRA] Criar `frontend/src/components/layout/BottomNav.tsx` — 5 ícones com labels (Home, Mapa, Horóscopo, Compatibilidade, Perfil); visível apenas em `< 1024 px`; active state com `--color-highlight`; `role="navigation"`, `aria-label="Navegação principal"`
- [x] T119 [P] [INFRA] Criar `frontend/src/components/layout/Sidebar.tsx` — visível apenas em `≥ 1024 px`; mesmos 5 itens + avatar do usuário + nome; `role="navigation"`, `aria-label="Menu lateral"`

### Acessibilidade (gates CI)

- [x] T120 [INFRA] Integrar `axe-core` nos testes Playwright — `frontend/tests/e2e/a11y.spec.ts` — verificar zero violações A/AA em todas as páginas públicas e autenticadas (welcome, login, register, home, natal-chart, horoscope, compatibility, profile)
- [x] T121 [INFRA] Verificar contraste de todas as combinações de texto / background nos dois temas usando ferramenta automatizada (ex: `color-contrast-checker` nos testes); inserir resultado no CI

### Performance (gates CI)

- [x] T122 [INFRA] Integrar `@lhci/cli` no `.github/workflows/ci-frontend.yml` — Lighthouse CI após build Vite; assert: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 90, LCP ≤ 2500 ms; bloquear merge em regressão > 5 pontos
- [x] T123 [INFRA] Analisar bundle com `vite-bundle-visualizer` após build; garantir chunk inicial ≤ 150 KB gzip; adicionar assertion no CI via `bundlesize` ou script customizado

### SEO

- [x] T124 [P] [INFRA] Adicionar `react-helmet-async` nas páginas públicas (`WelcomePage`, `LoginPage`, `RegisterPage`) — `title`, `meta description`, `og:title`, `og:description`, `og:image`, `canonical`
- [x] T125 [P] [INFRA] Criar `frontend/public/robots.txt` e `frontend/public/sitemap.xml` (estático, páginas públicas)

### Internacionalização — Auditoria Final

- [x] T126 [INFRA] Auditar `frontend/src/i18n/messages/pt-BR.json` — garantir que 100% das strings visíveis ao usuário estão externalizadas; adicionar script de lint de chaves de i18n ao CI que falha se encontrar strings hardcoded em componentes TSX
- [x] T127 [INFRA] Verificar que todos os usos de datas/horas/números usam `Intl.*` com locale explícito (`pt-BR`); grep no CI por `toLocaleDateString()`, `toLocaleTimeString()` sem argumento

### Monitoramento

- [x] T128 [P] [INFRA] Integrar Sentry no `frontend/src/main.tsx` — `Sentry.init` com DSN, `tracesSampleRate: 0.2`, ignoreErrors para erros de rede comuns
- [x] T129 [P] [INFRA] Integrar Sentry no `backend/src/app.ts` — `Sentry.init` + `Handlers.requestHandler()` + `Handlers.errorHandler()`

### Deploy

- [x] T130 [INFRA] Configurar `netlify.toml` em `frontend/` — `[build] command = "npm run build"`, `publish = "dist"`, redirects para SPA (`/* → /index.html 200`), headers de segurança (CSP, HSTS, X-Frame-Options)
- [x] T131 [INFRA] Configurar deploy do backend no Railway/Render — `Dockerfile` ou buildpack Node.js 20; variáveis de ambiente de produção; health check em `GET /api/health`
- [x] T132 [P] [INFRA] Criar `backend/src/routes/health.routes.ts` — `GET /api/health` retorna `{ status: "ok", version, uptime }` sem auth — usado pelo load balancer e health check do Railway

**Checkpoint final**: CI completo verde (lint, type-check, vitest ≥ 80% cobertura, Playwright E2E, axe-core zero violações, Lighthouse CI). App deployado em Netlify (frontend) + Railway (backend) com domínio configurado.

---

## Dependencies & Execution Order

### Dependências de Fase

- **Phase 1 (Setup)**: Sem dependências — iniciar imediatamente
- **Phase 2 (Fundação)**: Depende da Phase 1 — **BLOQUEIA** todas as user stories
- **Phase 3 (Auth + Perfil)**: Depende da Phase 2
- **Phase 4 (Mapa Natal)**: Depende da Phase 3 (requer usuário autenticado com dados de nascimento)
- **Phase 5 (Dashboard)**: Depende da Phase 4 (usa dados do mapa natal para planeta do dia + compatibilidade)
- **Phase 6 (Horóscopo)**: Pode iniciar em paralelo com Phase 5 após Phase 4 completa
- **Phase 7 (Onboarding)**: Pode iniciar após Phase 3; requer rotas existentes para o tour
- **Phase 8 (Compatibilidade)**: Pode iniciar em paralelo com Phase 5/6 após Phase 2
- **Phase 9 (PWA)**: Pode iniciar a qualquer momento após Phase 1 (não depende de features)
- **Phase 10 (Polish)**: Depende de todas as phases de feature

### Oportunidades de Paralelismo

```
Phase 1: T001 → T002+T003+T004+T005+T006+T007+T008 (todos em paralelo)
Phase 2: T020 → T021 → T022+T023+T024+T025 em paralelo → T026+T027+T028 em paralelo
Phase 3: T032+T033+T034 (testes em paralelo) → T036+T037 → implementações
         T044+T047+T049+T050+T051+T052 (frontend em paralelo com backend)
Phase 4: T057+T058+T059+T060 (testes em paralelo) → T063+T064+T065+T066+T067+T068+T069 em paralelo
         T076+T077+T078+T079 (componentes frontend em paralelo)
Phase 5+6: T083+T084+T085+T086 em paralelo; T087+T088+T089+T090+T091+T092 em paralelo
Phase 7: Onboarding (T103+T104+T105) paralelizável com Phase 5/6
Phase 8: T108+T109; T111+T112 em paralelo
Phase 10: T118+T119; T124+T125; T128+T129; T120+T121+T122+T123 após features completas
```

### Regras de Ouro

1. Testes são escritos **ANTES** da implementação — devem FALHAR na primeira execução
2. Módulo `astro/` (T063–T066) é 100% puro — qualquer I/O introduzido é uma violação bloqueante
3. Nenhuma cor hardcoded em componentes — sempre `var(--color-*)` (verificado por ESLint rule `no-restricted-syntax`)
4. Commit após cada tarefa ou grupo lógico concluído
5. Parar em cada **Checkpoint** para validar a user story de forma independente antes de avançar

