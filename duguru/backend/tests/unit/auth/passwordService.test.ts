import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../../src/auth/passwordService";

describe("hashPassword", () => {
  it("retorna uma string diferente da senha original", async () => {
    const hash = await hashPassword("SenhaForte123");
    expect(hash).not.toBe("SenhaForte123");
    expect(typeof hash).toBe("string");
  });

  it("gera hashes diferentes para a mesma senha (salt aleatório)", async () => {
    const hash1 = await hashPassword("MesmaSenha@1");
    const hash2 = await hashPassword("MesmaSenha@1");
    expect(hash1).not.toBe(hash2);
  });

  it("o hash começa com o prefixo bcrypt $2b$", async () => {
    const hash = await hashPassword("TesteHash123");
    expect(hash).toMatch(/^\$2b\$/);
  });
});

describe("verifyPassword", () => {
  it("retorna true para senha correta", async () => {
    const password = "MinhaSenh@Válida1";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("retorna false para senha incorreta", async () => {
    const hash = await hashPassword("SenhaCorreta1");
    const result = await verifyPassword("SenhaErrada1", hash);
    expect(result).toBe(false);
  });

  it("retorna false para string vazia", async () => {
    const hash = await hashPassword("SenhaValida99");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });

  it("é case-sensitive", async () => {
    const hash = await hashPassword("SenhaExata123");
    const result = await verifyPassword("senhaexata123", hash);
    expect(result).toBe(false);
  });
});
