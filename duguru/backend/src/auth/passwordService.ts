import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * hashPassword — Deriva o hash bcrypt de uma senha em texto plano.
 *
 * Custo: 12 rounds (~300 ms em hardware moderno) — Princípio III.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * verifyPassword — Compara uma senha em texto plano com um hash bcrypt.
 *
 * Seguro contra timing attacks (bcrypt.compare usa comparação constante).
 *
 * @returns `true` se a senha corresponde ao hash, `false` caso contrário.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
