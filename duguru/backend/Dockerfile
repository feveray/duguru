# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — duGuru Backend (Railway / Render)
# T131 [INFRA]
#
# Multi-stage build:
#   1. "builder" — instala deps, gera Prisma client, compila TypeScript
#   2. "runner"  — imagem mínima com apenas o compilado + ephemeris files
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Instala dependências de sistema necessárias para sweph (bindings nativos)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia manifestos de dependência primeiro (cache de layer)
COPY package*.json ./
COPY prisma ./prisma/

# Instala TODAS as dependências (incluindo devDeps para build)
RUN npm ci

# Gera Prisma client
RUN npx prisma generate

# Copia código-fonte
COPY . .

# Compila TypeScript → dist/
RUN npm run build


# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Metadados da imagem
LABEL org.opencontainers.image.title="duGuru API"
LABEL org.opencontainers.image.description="Backend API para astrologia pessoal duGuru"
LABEL org.opencontainers.image.version="0.1.0"

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Instala dependências de sistema para sweph em runtime
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia manifestos e instala apenas dependências de produção
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# Gera Prisma client no estágio runner (necessário em produção)
RUN npx prisma generate

# Copia compilado do stage builder
COPY --from=builder /app/dist ./dist

# Copia arquivos ephemeris Swiss Ephemeris (.se1) — necessários em runtime
COPY --from=builder /app/ephemeris ./ephemeris

# Usuário não-root por segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S duguru -u 1001 -G nodejs

USER duguru

EXPOSE $PORT

# Health check: Railway usa GET /api/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:$PORT/api/health || exit 1

# Ponto de entrada — server.js compilado
CMD ["node", "dist/server.js"]
