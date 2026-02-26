import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { SignJWT, importPKCS8 } from "jose";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  _resetKeyCache,
} from "../../../src/auth/jwtService";

/* garante que o cache de chaves é recarregado após setup.ts configurar as env vars */
beforeAll(() => {
  _resetKeyCache();
});

beforeEach(() => {
  _resetKeyCache();
});

/* ─── Helpers ──────────────────────────────────────────────────── */

/** Cria um access token expirado usando a chave privada das envs de teste */
async function makeExpiredToken(type: "access" | "refresh", family?: string): Promise<string> {
  const rawPrivate = process.env["RSA_PRIVATE_KEY"]!.replace(/\\n/g, "\n");
  const privateKey = await importPKCS8(rawPrivate, "RS256");

  const payload: Record<string, unknown> = { type };
  if (family) payload["family"] = family;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .setSubject("user_expired")
    .setIssuer("duguru-api")
    .setAudience("duguru-client")
    .setIssuedAt(new Date(Date.now() - 1000 * 60 * 60))      // 1 hora atrás
    .setExpirationTime(new Date(Date.now() - 1000 * 60 * 30)) // expirou há 30 min
    .sign(privateKey);
}

/* ─── Access Token ─────────────────────────────────────────────── */

describe("signAccessToken / verifyAccessToken", () => {
  it("assina e verifica um access token válido", async () => {
    const userId = "user_abc123";
    const token = await signAccessToken(userId);

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const payload = await verifyAccessToken(token);
    expect(payload.sub).toBe(userId);
    expect(payload.type).toBe("access");
  });

  it("rejeita um refresh token passado como access token", async () => {
    const refreshToken = await signRefreshToken("user_123", "family_abc");

    await expect(verifyAccessToken(refreshToken)).rejects.toMatchObject({
      code: "AUTH_INVALID_TOKEN",
    });
  });

  it("rejeita um access token expirado (código AUTH_TOKEN_EXPIRED)", async () => {
    const expired = await makeExpiredToken("access");

    await expect(verifyAccessToken(expired)).rejects.toMatchObject({
      code: "AUTH_TOKEN_EXPIRED",
    });
  });

  it("rejeita um token com assinatura adulterada", async () => {
    const token = await signAccessToken("user_valid");
    // Adultera os últimos 6 caracteres da assinatura
    const tampered = token.slice(0, -6) + "AAAAAA";

    await expect(verifyAccessToken(tampered)).rejects.toMatchObject({
      code: "AUTH_INVALID_TOKEN",
    });
  });

  it("rejeita um token malformado (string aleatória)", async () => {
    await expect(verifyAccessToken("not.a.jwt")).rejects.toMatchObject({
      code: "AUTH_INVALID_TOKEN",
    });
  });
});

/* ─── Refresh Token ────────────────────────────────────────────── */

describe("signRefreshToken / verifyRefreshToken", () => {
  it("assina e verifica um refresh token válido", async () => {
    const userId = "user_xyz";
    const family = "family_test";
    const token = await signRefreshToken(userId, family);

    const payload = await verifyRefreshToken(token);
    expect(payload.sub).toBe(userId);
    expect(payload.type).toBe("refresh");
    expect(payload.family).toBe(family);
  });

  it("rejeita um access token passado como refresh token", async () => {
    const accessToken = await signAccessToken("user_wrong");

    await expect(verifyRefreshToken(accessToken)).rejects.toMatchObject({
      code: "AUTH_INVALID_TOKEN",
    });
  });

  it("rejeita um refresh token expirado (código AUTH_REFRESH_TOKEN_EXPIRED)", async () => {
    const expired = await makeExpiredToken("refresh", "family_old");

    await expect(verifyRefreshToken(expired)).rejects.toMatchObject({
      code: "AUTH_REFRESH_TOKEN_EXPIRED",
    });
  });

  it("rejeita um token com payload type ausente", async () => {
    const rawPrivate = process.env["RSA_PRIVATE_KEY"]!.replace(/\\n/g, "\n");
    const privateKey = await importPKCS8(rawPrivate, "RS256");

    // Token sem campo `type`
    const noTypeToken = await new SignJWT({ family: "x" })
      .setProtectedHeader({ alg: "RS256" })
      .setSubject("user_notype")
      .setIssuer("duguru-api")
      .setAudience("duguru-client")
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(privateKey);

    await expect(verifyRefreshToken(noTypeToken)).rejects.toMatchObject({
      code: "AUTH_INVALID_TOKEN",
    });
  });
});
