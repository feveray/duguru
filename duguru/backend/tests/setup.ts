import { vi, beforeAll } from "vitest";
import { generateKeyPair, exportPKCS8, exportSPKI } from "jose";

/* Mock global para variáveis de ambiente nos testes */
vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("JWT_ACCESS_TOKEN_EXPIRES_IN", "15m");
vi.stubEnv("JWT_REFRESH_TOKEN_EXPIRES_IN", "7d");
vi.stubEnv("SMTP_HOST", "smtp.test.local");
vi.stubEnv("SMTP_PORT", "587");
vi.stubEnv("SMTP_USER", "test@duguru.test");
vi.stubEnv("SMTP_PASS", "test_smtp_pass");
vi.stubEnv("SMTP_FROM", "duGuru <no-reply@duguru.test>");
vi.stubEnv("FRONTEND_URL", "http://localhost:5173");

/**
 * Gera um par de chaves RSA efêmero (2048 bits) para uso em testes.
 * 2048 bits é suficiente para testes e muito mais rápido que 4096 bits.
 */
beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { modulusLength: 2048 });
  const privateKeyPem = await exportPKCS8(pair.privateKey);
  const publicKeyPem = await exportSPKI(pair.publicKey);

  // Armazena como string com \n literal (igual ao formato em .env)
  vi.stubEnv("RSA_PRIVATE_KEY", privateKeyPem.replace(/\n/g, "\\n"));
  vi.stubEnv("RSA_PUBLIC_KEY", publicKeyPem.replace(/\n/g, "\\n"));
});
