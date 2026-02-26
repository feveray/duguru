import nodemailer, { type Transporter } from "nodemailer";

/* ─── Transporter (lazy singleton) ────────────────────────────── */

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env["SMTP_HOST"],
    port: Number(process.env["SMTP_PORT"] ?? 587),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: {
      user: process.env["SMTP_USER"],
      pass: process.env["SMTP_PASS"],
    },
  });

  return _transporter;
}

const FROM = process.env["SMTP_FROM"] ?? "duGuru <no-reply@duguru.app>";
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

/* ─── Templates ───────────────────────────────────────────────── */

function passwordResetHtml(name: string, token: string): string {
  const link = `${FRONTEND_URL}/resetar-senha?token=${token}`;
  return `
    <h2>Redefinição de senha — duGuru</h2>
    <p>Olá, ${name}!</p>
    <p>Recebemos uma solicitação de redefinição de senha para sua conta.</p>
    <p>
      <a href="${link}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
        Redefinir minha senha
      </a>
    </p>
    <p>Este link expira em <strong>1 hora</strong>.</p>
    <p>Se você não solicitou isso, ignore este e-mail.</p>
    <hr/>
    <p style="color:#888;font-size:12px;">duGuru — Astrologia Pessoal</p>
  `;
}

function accountLockedHtml(name: string): string {
  return `
    <h2>Conta temporariamente bloqueada — duGuru</h2>
    <p>Olá, ${name}!</p>
    <p>Detectamos múltiplas tentativas de login com credenciais inválidas.</p>
    <p>Sua conta foi <strong>bloqueada por 15 minutos</strong> por segurança.</p>
    <p>Após este período, você poderá tentar novamente.</p>
    <p>Se não foi você, recomendamos alterar sua senha imediatamente.</p>
    <hr/>
    <p style="color:#888;font-size:12px;">duGuru — Astrologia Pessoal</p>
  `;
}

/* ─── Exported functions ──────────────────────────────────────── */

/**
 * sendPasswordResetEmail — Envia link de redefinição de senha.
 * Em ambiente de teste, apenas loga no console (não envia).
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  if (process.env["NODE_ENV"] === "test") {
    console.log(`[emailService] sendPasswordResetEmail → ${to}, token: ${token}`);
    return;
  }

  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: "Redefinição de senha — duGuru",
    html: passwordResetHtml(name, token),
  });
}

/**
 * sendAccountLockedEmail — Notifica sobre bloqueio de conta.
 * Em ambiente de teste, apenas loga no console.
 */
export async function sendAccountLockedEmail(
  to: string,
  name: string,
): Promise<void> {
  if (process.env["NODE_ENV"] === "test") {
    console.log(`[emailService] sendAccountLockedEmail → ${to}`);
    return;
  }

  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: "Conta bloqueada temporariamente — duGuru",
    html: accountLockedHtml(name),
  });
}

/** Reseta o transporter singleton (útil em testes). */
export function _resetTransporter(): void {
  _transporter = null;
}
