# Implementation Plan: duGuru — Aplicativo Web de Astrologia Pessoal

**Branch**: `001-duguru-app` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-duguru-app/spec.md`

---

## Summary

O duGuru é um aplicativo web de astrologia pessoal com mapa natal interativo (Swiss Ephemeris), horóscopo personalizado algorítmico, dashboard diário e compatibilidade entre signos. O frontend é uma SPA React com Vite, servida pelo Netlify; o backend é um serviço Node.js/Express no Railway/Render. O cálculo astronômico roda exclusivamente no backend (Node.js + sweph, sem WASM no browser) e os resultados são cacheados no banco de dados. O design implementa dark/light mode via CSS custom properties e é mobile-first com Tailwind CSS v3.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — frontend e backend  
**Primary Dependencies**:
- Frontend: React 18, Vite 5, Tailwind CSS v3, Framer Motion, React Router v6, Zustand, D3.js (mandala SVG), Axios, next-intl → adaptado para SPA (react-i18next)  
- Backend: Node.js 20 LTS, Express 4, sweph (Swiss Ephemeris binding), Prisma ORM, jose (JWT RS256), bcrypt, nodemailer, sharp (image processing), puppeteer/playwright (PDF geração)

**Storage**: PostgreSQL (Railway/Render) via Prisma ORM  
**Cache**: Cache de mapa astral na tabela `natal_chart_cache` do PostgreSQL (TTL 24 h); sem Redis nesta fase — adicionado quando necessário por escala  
**Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E)  
**Target Platform**: Web — mobile-first (PWA instalável), desktop ≥ 1024 px  
**Performance Goals**: LCP ≤ 2.5 s em 4G, INP ≤ 200 ms, CLS ≤ 0.1  
**Constraints**: Offline para mapa + horóscopo após primeira carga (PWA); bundle inicial ≤ 150 KB gzip; erros de cálculo astro < 0.001°; custo operacional mínimo (sem Redis, sem LLM)  
**Scale/Scope**: MVP — até ~5.000 usuários; PostgreSQL + backend único suficiente; escala horizontal adicionada se necessário  
**Deploy**: Netlify (frontend SPA + CDN) + Railway ou Render (backend API Node.js)  
**Geocoding**: OpenCage Geocoding API (plano gratuito: 2.500 req/dia) — fallback para Nominatim (OpenStreetMap, zero custo)  
**Email**: Nodemailer + SMTP (Brevo/Sendinblue plano gratuito: 300 emails/dia)

---

## Decisões de Stack

### Escolhas confirmadas

| Área | Decisão | Justificativa |
|---|---|---|
| Build tool | Vite 5 | HMR rápido, ESM nativo, plugin ecosystem maduro |
| Estado global | Zustand | Leve (< 1 KB), sem boilerplate, compatível com SSR futuro |
| Mandala SVG | D3.js com renderização manual | Controle total sobre interatividade e acessibilidade; bibliotecas astro-chart existentes têm acessibilidade inadequada |
| JWT | `jose` (Web Crypto API) | Suporte a RS256 com chaves assimétricas; zero dependências nativas |
| Cache | PostgreSQL (sem Redis) | Simplifica infra no MVP; cache de cálculo é por chave composta com TTL — volume baixo |
| PDF geração | Puppeteer headless no backend | Fidelidade visual perfeita; geração assíncrona com entrega por email para evitar timeout |
| i18n | react-i18next | Amplamente suportado em SPA Vite/React; compatível com namespaces e lazy loading de traduções |
| Auth externa | — rejeitado Firebase Auth | Mantém controle total dos tokens e dados; evita vendor lock-in; alinhado com Princípio III da Constituição |
| Banco | PostgreSQL + Prisma (não Firebase Firestore) | Queries relacionais, transações ACID, Prisma type-safety; Firestore rejeitado por modelo eventual e custo imprevisível |
| Horóscopo | cálculo próprio via sweph (não FreeAstrologyAPI.com) | Garante precisão, funciona offline, sem dependência de API externa |

### Decisão crítica: sweph roda APENAS no backend

`sweph` é um binding nativo Node.js — não compila para browser/WASM neste setup. Todo cálculo astronômico (mapa natal, trânsitos, fases da lua, horóscopo) é feito pela API do backend e os resultados servidos ao frontend via JSON. O frontend renderiza o SVG com D3.js a partir dos dados recebidos.

---

## Constitution Check

| Princípio | Status | Notas |
|---|---|---|
| I. Dark/Light Mode | ✅ | CSS custom properties via Tailwind CSS v3 `theme.extend` + `[data-theme]` selector |
| II. Mobile-First | ✅ | Tailwind mobile-first por padrão; bottom nav no mobile, sidebar no desktop |
| III. JWT RS256 + HttpOnly cookie | ✅ | `jose` RS256; refresh em cookie `HttpOnly; Secure; SameSite=Strict`; Refresh Token Rotation |
| IV. Swiss Ephemeris | ✅ | `sweph` no backend; módulo puro sem I/O; cache com chave composta; efemérides 1800–2400 |
| V. TypeScript Strict | ✅ | `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` em ambos os projetos |
| VI. Cobertura ≥ 80% | ✅ | Vitest + RTL + Playwright; 100% no módulo astro, 95% nas rotas de auth |
| VII. LCP < 2.5 s | ✅ | Vite code splitting; bundle ≤ 150 KB; sweph no backend (sem WASM no browser) |
| VIII. WCAG 2.1 AA | ✅ | axe-core no Playwright; SVG com aria-describedby; contraste verificado nos dois temas |
| IX. i18n PT-BR | ✅ | react-i18next; zero strings hardcoded; `Intl.*` com locale explícito |

**Violações**: nenhuma — stack alinhada com todos os princípios da Constituição.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-duguru-app/
├── spec.md        ✅ criada
├── plan.md        ✅ este arquivo
└── tasks.md       ⬜ próximo (/speckit.tasks)
```

### Source Code (repository root)

```text
duguru/                          ← raiz do workspace
├── frontend/                    ← SPA React + Vite
│   ├── public/
│   │   ├── manifest.json        ← PWA manifest
│   │   ├── sw.js                ← service worker (gerado por vite-plugin-pwa)
│   │   └── icons/               ← ícones PWA 192×192 e 512×512
│   ├── src/
│   │   ├── assets/              ← fontes, imagens, mascote SVG
│   │   ├── components/          ← componentes reutilizáveis
│   │   │   ├── ui/              ← primitivos: Button, Input, Toast, Skeleton, Modal…
│   │   │   ├── chart/           ← NatalChartWheel, PlanetRow, AspectLine, ChartTable
│   │   │   ├── horoscope/       ← HoroscopeCard, PeriodTabs, SectionBlock
│   │   │   ├── dashboard/       ← DailyPlanet, MoonPhase, DailyQuote, AlertBanner, CompatTop3
│   │   │   ├── compatibility/   ← CompatScore, SynastrySummary
│   │   │   ├── auth/            ← LoginForm, RegisterForm, ForgotPasswordForm
│   │   │   ├── layout/          ← BottomNav, Sidebar, TopBar, OnboardingOverlay
│   │   │   └── profile/         ← AvatarUpload, ProfileForm
│   │   ├── pages/               ← rotas React Router v6
│   │   │   ├── WelcomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── NatalChartPage.tsx
│   │   │   ├── HoroscopePage.tsx
│   │   │   ├── CompatibilityPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── stores/              ← Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── chartStore.ts
│   │   │   ├── themeStore.ts
│   │   │   └── onboardingStore.ts
│   │   ├── services/            ← chamadas à API backend
│   │   │   ├── api.ts           ← axios instance com interceptors JWT
│   │   │   ├── authService.ts
│   │   │   ├── chartService.ts
│   │   │   ├── horoscopeService.ts
│   │   │   ├── compatibilityService.ts
│   │   │   └── geocodingService.ts
│   │   ├── hooks/               ← custom hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useTheme.ts
│   │   │   ├── useNatalChart.ts
│   │   │   └── usePWAInstall.ts
│   │   ├── lib/                 ← utilitários puros (sem I/O)
│   │   │   ├── svgChart.ts      ← helpers D3 para mandala
│   │   │   ├── dateUtils.ts
│   │   │   └── zodiacSymbols.ts
│   │   ├── i18n/
│   │   │   ├── index.ts         ← configuração react-i18next
│   │   │   └── messages/
│   │   │       └── pt-BR.json   ← todas as strings da UI
│   │   ├── styles/
│   │   │   ├── globals.css      ← CSS custom properties (tokens light/dark)
│   │   │   └── tailwind.css
│   │   ├── router.tsx           ← React Router v6 declarativo
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   │   ├── unit/                ← Vitest + RTL
│   │   ├── integration/         ← Vitest (mocked API)
│   │   └── e2e/                 ← Playwright
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json            ← strict: true
│   └── package.json
│
├── backend/                     ← API Node.js + Express
│   ├── src/
│   │   ├── astro/               ← módulo puro Swiss Ephemeris (ZERO I/O)
│   │   │   ├── ephemeris.ts     ← wrapper sweph: calcPlanet, calcHouses, calcAspects
│   │   │   ├── moonPhase.ts     ← cálculo fase lunar
│   │   │   ├── transits.ts      ← trânsitos para horóscopo
│   │   │   ├── synastry.ts      ← aspectos entre dois mapas
│   │   │   ├── interpretations/ ← banco curado JSON (não código)
│   │   │   │   ├── planets-in-signs.json    ← 10×12 = 120 textos
│   │   │   │   ├── planets-in-houses.json   ← 10×12 = 120 textos
│   │   │   │   └── transits-by-sign.json    ← 10×12×5 = 600 textos (horóscopo)
│   │   │   └── interpretationProvider.ts    ← interface InterpretationProvider
│   │   ├── auth/
│   │   │   ├── jwtService.ts    ← RS256 assinar/verificar via jose
│   │   │   ├── passwordService.ts ← bcrypt hash/verify
│   │   │   ├── tokenStore.ts    ← deny-list refresh tokens (tabela PostgreSQL)
│   │   │   └── authMiddleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts   ← POST /register, /login, /refresh, /logout, /forgot-password, /reset-password
│   │   │   ├── chart.routes.ts  ← GET /natal-chart, GET /natal-chart/pdf, POST /natal-chart/email
│   │   │   ├── horoscope.routes.ts ← GET /horoscope/:period
│   │   │   ├── dashboard.routes.ts ← GET /daily
│   │   │   ├── compatibility.routes.ts ← GET /compatibility, POST /synastry
│   │   │   ├── profile.routes.ts ← GET/PATCH /profile, POST /profile/avatar
│   │   │   └── geocoding.routes.ts ← GET /geocoding/search
│   │   ├── services/
│   │   │   ├── chartService.ts  ← orquestra cálculo + cache
│   │   │   ├── horoscopeService.ts
│   │   │   ├── dailyContentService.ts
│   │   │   ├── emailService.ts  ← nodemailer
│   │   │   ├── pdfService.ts    ← puppeteer → PDF/PNG
│   │   │   └── geocodingService.ts ← OpenCage + Nominatim fallback
│   │   ├── db/
│   │   │   └── prisma/
│   │   │       └── schema.prisma
│   │   ├── middleware/
│   │   │   ├── rateLimiter.ts   ← express-rate-limit (login: 5/15min)
│   │   │   ├── errorHandler.ts
│   │   │   └── requestLogger.ts
│   │   ├── types/               ← tipos compartilhados
│   │   └── app.ts               ← Express app factory
│   ├── tests/
│   │   ├── unit/                ← astro/ módulo (cobertura 100%)
│   │   └── integration/         ← rotas (cobertura 95% auth)
│   ├── ephemeris/               ← arquivos .se1 (1800–2400), imutáveis
│   ├── tsconfig.json
│   └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci-frontend.yml      ← lint, type-check, vitest, playwright, lighthouse
│       └── ci-backend.yml       ← lint, type-check, vitest, cobertura
├── .specify/                    ← speckit tooling (pré-existente)
└── specs/                       ← documentação de feature (pré-existente)
```

---

## Modelo de Dados (Prisma Schema)

```prisma
// Referência — detalhes finais no data-model.md

model User {
  id              String   @id @default(cuid())
  name            String
  email           String   @unique
  passwordHash    String
  avatarUrl       String?
  birthDate       DateTime @db.Date
  birthTime       String?       // "HH:MM" | null → usa 12:00 se ausente
  birthCity       String
  birthCountry    String
  birthLat        Float
  birthLon        Float
  timezone        String        // IANA tz (ex: "America/Sao_Paulo")
  houseSystem     String  @default("P") // P=Placidus, K=Koch, W=WholeSign, E=Equal, C=Campanus
  locale          String  @default("pt-BR")
  onboardingDone  Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  refreshTokens   RefreshToken[]
  natalChartCache NatalChartCache?
}

model RefreshToken {
  id         String    @id @default(cuid())
  userId     String
  tokenHash  String    @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model NatalChartCache {
  id          String   @id @default(cuid())
  userId      String   @unique
  cacheKey    String   @unique  // "{date_utc}:{lat}:{lon}:{houseSystem}"
  payload     Json              // posições + casas + aspectos calculados
  calculatedAt DateTime
  expiresAt   DateTime          // calculatedAt + 24h
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model DailyContent {
  id              String   @id @default(cuid())
  date            DateTime @db.Date @unique
  planet          String
  planetInfluence String
  moonPhase       String
  moonDescription String
  moonNextCycle   DateTime @db.Date
  inspirationalQuote String
  alerts          Json     // [{event, startDate, endDate, signs, tip}]
  createdAt       DateTime @default(now())
}

model CompatibilityScore {
  id         String @id @default(cuid())
  sign1      String
  sign2      String
  romance    Int    // 0–100
  friendship Int
  work       Int
  updatedAt  DateTime @updatedAt

  @@unique([sign1, sign2])
}
```

> **Nota**: `Horoscope` não é persistido — gerado em tempo real via horoscopeService e cacheado em memória por hora no processo do backend.

---

## API Contracts (resumo)

### Auth
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | — | Cria conta; retorna access token + seta refresh cookie |
| POST | `/api/auth/login` | — | Autentica; rate-limited (5/15min) |
| POST | `/api/auth/refresh` | cookie | Refresh Token Rotation |
| POST | `/api/auth/logout` | cookie | Revoga refresh token |
| POST | `/api/auth/forgot-password` | — | Envia email com link |
| POST | `/api/auth/reset-password` | — | Consome link; altera senha |

### Mapa Natal
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/chart/natal` | ✅ | Retorna posições + casas + aspectos + interpretações (cacheado) |
| GET | `/api/chart/natal/download?format=pdf\|png` | ✅ | Gera e retorna arquivo |
| POST | `/api/chart/natal/email` | ✅ | Gera e envia por email (assíncrono) |

### Horóscopo
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/horoscope/:period` | ✅ | `period` = `day\|week\|month\|year` |

### Dashboard
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/daily` | ✅ | Planeta do dia, fase lunar, frase, alertas, top3 compatibilidade |

### Compatibilidade
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/compatibility?sign1=&sign2=` | ✅ | Score por área |
| POST | `/api/synastry` | ✅ | Sinastria entre dois conjuntos de dados de nascimento |

### Perfil e Geocoding
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/profile` | ✅ | Dados do perfil |
| PATCH | `/api/profile` | ✅ | Atualiza perfil (recalcula mapa se dados de nascimento mudarem) |
| POST | `/api/profile/avatar` | ✅ | Upload avatar (multipart/form-data, ≤ 5 MB) |
| GET | `/api/geocoding/search?q=` | ✅ | Autocomplete cidade (OpenCage → Nominatim fallback) |

**Formato de erro padrão** (todos os erros):
```json
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "...", "status": 401 } }
```

---

## Fases de Implementação

### Fase 0 — Infraestrutura e Fundação (sem features)
- Monorepo com `frontend/` e `backend/` (workspaces npm ou estrutura manual)
- `tsconfig.json` strict em ambos os projetos
- ESLint + Prettier configurados
- Tailwind CSS v3 com design tokens (CSS custom properties para light/dark)
- Design system básico: tokens de cor da paleta duGuru
- CI/CD: GitHub Actions (lint + type-check) funcionando
- PostgreSQL provisionado (Railway dev) + Prisma schema inicial
- Variáveis de ambiente documentadas (`.env.example`)

### Fase 1 — Autenticação Completa (P1)
- Backend: rotas register, login, refresh, logout, forgot/reset-password
- JWT RS256 (gerar par de chaves RSA no setup)
- Refresh Token Rotation + tabela `RefreshToken` + rate limiting
- Frontend: WelcomePage, LoginPage, RegisterPage, ForgotPasswordForm
- Zustand `authStore` + axios interceptors (auto-refresh em 401)
- Cobertura: ≥ 95% nas rotas de auth
- **Critério de done**: fluxo cadastro → login → logout → recuperação de senha E2E passando

### Fase 2 — Mapa Natal (P1)
- Backend: módulo `astro/` com sweph (ephemeris isolado, 100% testado)
- Cálculo de 10 planetas, 12 casas (Placidus default), 5 tipos de aspectos
- Banco curado: `planets-in-signs.json` (120) + `planets-in-houses.json` (120)
- Rota GET `/api/chart/natal` com cache PostgreSQL
- Frontend: NatalChartPage com mandala SVG (D3.js), tabela de posições, painel de interpretação
- Seletor de sistema de casas
- Download PDF/PNG (assíncrono + email)
- Acessibilidade: SVG com `role="img"` + tabela alternativa
- **Critério de done**: usuário vê mapa natal com posições corretas (validado contra Astro.com para 3 fixtures)

### Fase 3 — Dashboard e Horóscopo (P2)
- Backend: `transits.ts` + `transits-by-sign.json` (600 entradas)
- Rotas horóscopo (day/week/month/year) + rota daily (planeta, lua, frase, alertas, top3)
- `DailyContent` table + seed para 365 frases
- Frontend: HomePage (dashboard), HoroscopePage com tabs de período
- Fase lunar com imagem e descrição
- `CompatibilityScore` table com seed (12×12 = 144 registros)
- **Critério de done**: horóscopo do dia exibe 5 seções para o signo do usuário; dashboard mostra todos os blocos

### Fase 4 — Compatibilidade, PWA e Perfil (P2/P3)
- Frontend: CompatibilityPage (score + barras), ProfilePage (avatar upload, edição de dados)
- Backend: rotas compatibilidade + sinastria + perfil + avatar (sharp para crop circular)
- PWA: `vite-plugin-pwa` com service worker cacheando mapa + horóscopo offline
- Onboarding: 3–4 passos com overlay (estado em Zustand + persistência no perfil)
- **Critério de done**: PWA instalável; mapa e horóscopo acessíveis offline; sinastria calcula e exibe score

### Fase 5 — Qualidade, SEO e Deploy (todos)
- Meta tags dinâmicas nas páginas públicas (`react-helmet-async`)
- Lighthouse CI integrado ao GitHub Actions (gate: Performance ≥ 85, A11y ≥ 95)
- axe-core no Playwright (gate: zero violações A/AA)
- Bundle analysis (vite-bundle-visualizer) — chunk inicial ≤ 150 KB gzip
- Deploy: Netlify (frontend) + Railway (backend) com variáveis de ambiente de produção
- Monitoramento: Sentry (frontend + backend), Vercel Analytics → ou Netlify Analytics

---

## Complexity Tracking

Nenhuma violação dos princípios da Constituição identificada.

| Decisão | Por que não é violação |
|---|---|
| sweph apenas no backend (não WASM) | Princípio IV diz "WASM port equivalente" — binding nativo Node.js é explicitamente listado como opção |
| Cache em PostgreSQL (não Redis) | Princípio IV define Redis como padrão mas Redis é adicionado quando escala exigir; PostgreSQL com TTL é solução válida no MVP |
| react-i18next em vez de next-intl | Princípio IX diz "next-intl ou equivalente" — react-i18next é o equivalente para SPA Vite |
| Horóscopo cacheado em memória (processo) | Cache de horóscopo por hora no processo é adequado para MVP; move para Redis quando múltiplas instâncias forem necessárias |
