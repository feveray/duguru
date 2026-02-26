import { test, expect, type Page } from "@playwright/test";

/* ─── Helpers ──────────────────────────────────────────────────── */

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

async function fillRegisterForm(page: Page, data: {
  name?: string;
  email?: string;
  password?: string;
  birthDate?: string;
  birthTime?: string;
  city?: string;
}) {
  if (data.name)      await page.getByLabel(/nome completo/i).fill(data.name);
  if (data.email)     await page.getByLabel(/e-mail/i).fill(data.email);
  if (data.password)  await page.getByLabel(/^senha/i).fill(data.password);
  if (data.birthDate) await page.getByLabel(/data de nascimento/i).fill(data.birthDate);
  if (data.birthTime) await page.getByLabel(/horário de nascimento/i).fill(data.birthTime);
}

/* ─── Welcome Page ────────────────────────────────────────────── */

test.describe("WelcomePage", () => {
  test("exibe logo e botões de navegação", async ({ page }) => {
    await page.goto(`${BASE_URL}/boas-vindas`);

    await expect(page.locator("h1")).toContainText("Guru");
    await expect(page.getByRole("link", { name: /criar conta/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /entrar/i })).toBeVisible();
  });

  test("navega para /cadastro ao clicar em Criar Conta", async ({ page }) => {
    await page.goto(`${BASE_URL}/boas-vindas`);
    await page.getByRole("link", { name: /criar conta/i }).click();
    await expect(page).toHaveURL(/\/cadastro/);
  });

  test("navega para /login ao clicar em Entrar", async ({ page }) => {
    await page.goto(`${BASE_URL}/boas-vindas`);
    await page.getByRole("link", { name: /entrar/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

/* ─── Login Page ──────────────────────────────────────────────── */

test.describe("LoginPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
  });

  test("exibe campo de e-mail e senha", async ({ page }) => {
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
  });

  test("exibe erro de validação para campos vazios", async ({ page }) => {
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("exibe erro de credenciais inválidas (happy path do erro)", async ({ page }) => {
    await page.getByLabel(/e-mail/i).fill("nao@existe.com");
    await page.getByLabel(/senha/i).fill("SenhaErrada123");
    await page.getByRole("button", { name: /entrar/i }).click();

    // Aguarda toast ou mensagem de erro (API mockada em E2E retorna 401)
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 5_000 });
  });

  test("link 'Esqueci minha senha' navega para /esqueci-senha", async ({ page }) => {
    await page.getByRole("link", { name: /esqueci/i }).click();
    await expect(page).toHaveURL(/\/esqueci-senha/);
  });

  test("link 'Criar conta' navega para /cadastro", async ({ page }) => {
    await page.getByRole("link", { name: /criar conta/i }).click();
    await expect(page).toHaveURL(/\/cadastro/);
  });
});

/* ─── Register Page ───────────────────────────────────────────── */

test.describe("RegisterPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`);
  });

  test("exibe todos os campos obrigatórios", async ({ page }) => {
    await expect(page.getByLabel(/nome completo/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/^senha/i)).toBeVisible();
    await expect(page.getByLabel(/data de nascimento/i)).toBeVisible();
  });

  test("exibe erros de validação quando submetido vazio", async ({ page }) => {
    await page.getByRole("button", { name: /criar conta/i }).click();
    const alerts = page.getByRole("alert");
    await expect(alerts.first()).toBeVisible();
  });

  test("toggle 'não sei o horário' oculta campo de horário", async ({ page }) => {
    const toggleLabel = page.getByText(/não sei o horário/i);
    if (await toggleLabel.isVisible()) {
      await toggleLabel.click();
      await expect(page.getByLabel(/horário de nascimento/i)).not.toBeVisible();
    }
  });
});

/* ─── Forgot Password Page ────────────────────────────────────── */

test.describe("ForgotPasswordPage", () => {
  test("exibe campo de e-mail e botão de envio", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-senha`);

    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enviar/i })).toBeVisible();
  });

  test("valida campo de e-mail vazio", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-senha`);
    await page.getByRole("button", { name: /enviar/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
