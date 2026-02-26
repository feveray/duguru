import { SignJWT, jwtVerify, importPKCS8, importSPKI, type JWTPayload, type KeyLike } from "jose";
import { createError } from "../middleware/errorHandler";

/* ─── Environment ────────────────────────────────────────────────── */

const ACCESS_TOKEN_EXPIRES_IN = process.env["JWT_ACCESS_TOKEN_EXPIRES_IN"] ?? "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env["JWT_REFRESH_TOKEN_EXPIRES_IN"] ?? "7d";
const ALGORITHM = "RS256";
const ISSUER = "duguru-api";
const AUDIENCE = "duguru-client";

/* ─── Key loading (lazy, cached per process) ─────────────────────── */

type KeyPair = {
  privateKey: KeyLike;
  publicKey: KeyLike;
};

let _keyPair: KeyPair | null = null;

/**
 * Normaliza uma chave PEM armazenada em variável de ambiente.
 * Suporta tanto `\n` literais (de dotenv) quanto quebras de linha reais.
 */
function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

async function getKeyPair(): Promise<KeyPair> {
  if (_keyPair) return _keyPair;

  const rawPrivate = process.env["RSA_PRIVATE_KEY"];
  const rawPublic = process.env["RSA_PUBLIC_KEY"];

  if (!rawPrivate || !rawPublic) {
    throw new Error(
      "RSA_PRIVATE_KEY and RSA_PUBLIC_KEY must be set in environment variables. " +
        "See backend/README.md for key generation instructions.",
    );
  }

  const privateKey = await importPKCS8(normalizePem(rawPrivate), ALGORITHM);
  const publicKey = await importSPKI(normalizePem(rawPublic), ALGORITHM);

  const pair: KeyPair = { privateKey, publicKey };
  _keyPair = pair;
  return pair;
}

/* ─── Token payload types ────────────────────────────────────────── */

export interface AccessTokenPayload extends JWTPayload {
  sub: string;  // userId
  type: "access";
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;  // userId
  type: "refresh";
  /** Token family ID — para Refresh Token Rotation */
  family: string;
}

/* ─── Sign ─────────────────────────────────────────────────────── */

/**
 * Gera um access token JWT (RS256, 15 min por padrão).
 */
export async function signAccessToken(userId: string): Promise<string> {
  const { privateKey } = await getKeyPair();

  return new SignJWT({ type: "access" } satisfies Pick<AccessTokenPayload, "type">)
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(privateKey);
}

/**
 * Gera um refresh token JWT (RS256, 7 dias por padrão).
 * @param family UUID da família do token (Refresh Token Rotation).
 */
export async function signRefreshToken(
  userId: string,
  family: string,
): Promise<string> {
  const { privateKey } = await getKeyPair();

  return new SignJWT({
    type: "refresh",
    family,
  } satisfies Pick<RefreshTokenPayload, "type" | "family">)
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(privateKey);
}

/* ─── Verify ─────────────────────────────────────────────────────── */

/**
 * Verifica e decodifica um access token.
 * Lança erro padronizado (401) se inválido ou expirado.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { publicKey } = await getKeyPair();

  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (payload["type"] !== "access") {
      throw createError(401, "AUTH_INVALID_TOKEN", "Token inválido: tipo incorreto.");
    }

    return payload as AccessTokenPayload;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      typeof (err as { code?: string }).code === "string"
    ) {
      const code = (err as { code: string }).code;
      if (code === "ERR_JWT_EXPIRED") {
        throw createError(401, "AUTH_TOKEN_EXPIRED", "Token expirado.");
      }
    }
    // Re-throw se já for um ApiError gerado por nós
    if (err instanceof Error && "statusCode" in err) throw err;

    throw createError(401, "AUTH_INVALID_TOKEN", "Token de acesso inválido.");
  }
}

/**
 * Verifica e decodifica um refresh token.
 * Lança erro padronizado (401) se inválido ou expirado.
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { publicKey } = await getKeyPair();

  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (payload["type"] !== "refresh") {
      throw createError(401, "AUTH_INVALID_TOKEN", "Token inválido: tipo incorreto.");
    }

    return payload as RefreshTokenPayload;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      typeof (err as { code?: string }).code === "string"
    ) {
      const code = (err as { code: string }).code;
      if (code === "ERR_JWT_EXPIRED") {
        throw createError(401, "AUTH_REFRESH_TOKEN_EXPIRED", "Sessão expirada. Faça login novamente.");
      }
    }
    if (err instanceof Error && "statusCode" in err) throw err;

    throw createError(401, "AUTH_INVALID_REFRESH_TOKEN", "Refresh token inválido.");
  }
}

/** Reseta o cache de chaves (útil em testes). */
export function _resetKeyCache(): void {
  _keyPair = null;
}
