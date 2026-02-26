# duGuru — Backend API

## Stack

- **Node.js 20 LTS** + Express 4 + TypeScript 5 (strict)
- **Prisma ORM** → PostgreSQL (Neon)
- **JWT RS256** via `jose` (Refresh Token Rotation)
- **bcrypt** (rounds: 12)
- **sweph** (Swiss Ephemeris — módulo puro, zero I/O)

---

## Setup rápido

```bash
cp .env.example .env
# Preencha DATABASE_URL, RSA_PRIVATE_KEY, RSA_PUBLIC_KEY, etc.

npm install
npx prisma generate
npx prisma db push     # ou: prisma migrate dev --name init
npm run dev
```

---

## Geração das chaves RSA para JWT (T026)

O JWT usa RS256 (RSA Signature with SHA-256). Você precisa de um par de chaves RSA **4096 bits**.

### Passo a passo (OpenSSL)

```bash
# 1. Gerar chave privada
openssl genrsa -out private_key.pem 4096

# 2. Extrair chave pública
openssl rsa -in private_key.pem -pubout -out public_key.pem

# 3. Verificar
openssl rsa -in private_key.pem -check
```

### Colocar no `.env`

Cole os conteúdos dos arquivos `.pem` nas variáveis de ambiente.  
Como o `.env` não suporta strings multiline facilmente, substitua as quebras de linha por `\n`:

```bash
# Gera o valor pronto para o .env
awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' private_key.pem
awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' public_key.pem
```

Cole os resultados no `.env`:

```dotenv
RSA_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEow...restante...\n-----END RSA PRIVATE KEY-----\n
RSA_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIIBIj...restante...\n-----END PUBLIC KEY-----\n
```

> **Segurança**: Nunca commite os arquivos `.pem` ou o `.env`. Ambos estão no `.gitignore`.

### Em produção (Railway / Render)

Configure as variáveis de ambiente diretamente no dashboard da plataforma.  
As quebras de linha serão preservadas se você colar o conteúdo raw do `.pem`.

---

## Variáveis de ambiente

Veja [`.env.example`](./.env.example) para a lista completa e documentação de cada variável.

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento (tsx watch) |
| `npm run build` | Compilação TypeScript para `dist/` |
| `npm start` | Inicia o servidor compilado |
| `npm run lint` | ESLint com `@typescript-eslint/recommended-type-checked` |
| `npm run type-check` | TypeScript sem emitir arquivos |
| `npm test` | Vitest com cobertura |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:seed` | Executa seeds (frases, compatibilidade) |
| `npm run db:studio` | Abre o Prisma Studio |

---

## Estrutura

```
src/
├── app.ts              ← Express factory (middlewares + routers)
├── server.ts           ← Ponto de entrada (listen)
├── auth/
│   ├── jwtService.ts       ← RS256 sign/verify (jose)
│   ├── passwordService.ts  ← bcrypt hash/verify
│   ├── tokenStore.ts       ← Refresh Token Rotation (PostgreSQL)
│   └── authMiddleware.ts   ← Extrai e valida JWT do header Bearer
├── astro/              ← Módulo PURO Swiss Ephemeris (zero I/O)
├── routes/             ← Express routers
├── services/           ← Lógica de negócio (chart, horoscope, email…)
├── middleware/         ← errorHandler, requestLogger, rateLimiter
├── db/
│   └── client.ts       ← Prisma singleton
└── types/
    └── express.d.ts    ← Extensão Request com req.user
```
