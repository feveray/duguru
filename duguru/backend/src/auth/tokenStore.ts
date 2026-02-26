import { createHash } from "crypto";
import { prisma } from "../db/client";
import { createError } from "../middleware/errorHandler";
import { verifyRefreshToken } from "./jwtService";
import type { RefreshTokenPayload } from "./jwtService";

/* ─── Helpers ─────────────────────────────────────────────────── */

/**
 * hashToken — Deriva SHA-256 do token JWT (para armazenamento seguro).
 * SHA-256 é suficiente para tokens aleatórios de entropia alta.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ─── Public API ──────────────────────────────────────────────── */

export interface SaveRefreshTokenOptions {
  userId: string;
  token: string;
  expiresAt: Date;
}

/**
 * saveRefreshToken — Persiste hash do refresh token no banco.
 */
export async function saveRefreshToken({
  userId,
  token,
  expiresAt,
}: SaveRefreshTokenOptions): Promise<void> {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });
}

/**
 * revokeRefreshToken — Marca um refresh token como revogado (soft delete).
 * Não lança erro se o token não for encontrado (idempotente).
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);

  await prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  }).catch(() => {
    // Token não encontrado — idempotente, sem erro.
  });
}

/**
 * isTokenRevoked — Verifica se um refresh token foi revogado ou expirou.
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const record = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return record === null;
}

/**
 * rotateRefreshToken — Refresh Token Rotation (RFC 6819, §4.4.1).
 *
 * 1. Valida o token JWT
 * 2. Verifica se não foi revogado (proteção contra replay)
 * 3. Revoga o token antigo
 * 4. Retorna o payload para que o caller emita um novo par de tokens
 *
 * Se o token já foi revogado (possível roubo), revoga TODA a família
 * e lança erro 401.
 */
export async function rotateRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const payload = await verifyRefreshToken(token);
  const revoked = await isTokenRevoked(token);

  if (revoked) {
    // Possível roubo: invalidar todos os tokens do usuário
    await prisma.refreshToken.deleteMany({
      where: { userId: payload.sub },
    });
    throw createError(
      401,
      "AUTH_REFRESH_TOKEN_REUSE",
      "Sessão inválida. Faça login novamente.",
    );
  }

  await revokeRefreshToken(token);
  return payload;
}
