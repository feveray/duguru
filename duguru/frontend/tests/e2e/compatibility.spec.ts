/**
 * frontend/tests/e2e/compatibility.spec.ts
 *
 * Testes E2E da página de Compatibilidade (CompatibilityPage).
 * Verifica: seleção de signos, exibição de scores, aba de sinastria.
 * Usa interceptação de API para não depender de backend real.
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

const FAKE_COMPAT_SCORE = {
  ok: true,
  data: {
    sign1:      "aries",
    sign2:      "leo",
    romance:    85,
    friendship: 78,
    work:       70,
    updatedAt:  "2026-01-01T00:00:00.000Z",
  },
};

const FAKE_SYNASTRY = {
  ok: true,
  data: {
    aspects: [
      {
        planet1:   "sun",
        planet2:   "moon",
        type:      "trine",
        orb:       2.5,
        applying:  true,
        intensity: 69,
        influence: "Harmonia natural e compreensão profunda.",
      },
      {
        planet1:   "venus",
        planet2:   "mars",
        type:      "sextil",
        orb:       3.1,
        applying:  false,
        intensity: 48,
        influence: "Fluxo fácil e oportunidades de cooperação.",
      },
      {
        planet1:   "mercury",
        planet2:   "jupiter",
        type:      "conjunction",
        orb:       1.2,
        applying:  true,
        intensity: 80,
        influence: "União intensa das energias mentais.",
      },
    ],
    score: {
      overall:    72,
      romance:    80,
      friendship: 68,
      work:       65,
    },
    person1: { birthDate: "1990-03-15", birthTime: "12:00", lat: -23.55, lon: -46.63 },
    person2: { birthDate: "1988-08-20", birthTime: "12:00", lat: -22.91, lon: -43.17 },
  },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

async function setupAuth(page: import("@playwright/test").Page) {
  const fakeAuth = JSON.stringify({
    state: {
      user: {
        id:             "test-user-id",
        name:           "Usuário Teste",
        email:          "e2e@duguru.app",
        sunSign:        "aries",
        ascendant:      "capricorn",
        onboardingDone: true,
      },
      isAuthenticated: true,
    },
    version: 0,
  });
  await page.addInitScript((auth: string) => {
    localStorage.setItem("duguru-auth", auth);
  }, fakeAuth);
}

/* ─── Sem autenticação ────────────────────────────────────────────────────── */

test.describe("CompatibilityPage — sem autenticação", () => {
  test("redireciona para /login ou /boas-vindas se não autenticado", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await expect(page).toHaveURL(/\/(login|boas-vindas)/);
  });
});

/* ─── Com autenticação ────────────────────────────────────────────────────── */

test.describe("CompatibilityPage — aba Signos", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);

    /* Interceptar API de compatibilidade */
    await page.route("**/api/compatibility**", (route) => {
      void route.fulfill({
        status:      200,
        contentType: "application/json",
        body:        JSON.stringify(FAKE_COMPAT_SCORE),
      });
    });
  });

  test("exibe título Compatibilidade", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await expect(page.getByRole("heading", { name: /compatibilidade/i })).toBeVisible();
  });

  test("exibe tabs Signos e Sinastria", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await expect(page.getByRole("tab", { name: /signos/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /sinastria/i })).toBeVisible();
  });

  test("exibe seletores de signos", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await expect(page.locator("#sign1")).toBeVisible();
    await expect(page.locator("#sign2")).toBeVisible();
  });

  test("exibe scores de Romance, Amizade e Trabalho", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await expect(page.getByText(/romance/i)).toBeVisible();
    await expect(page.getByText(/amizade/i)).toBeVisible();
    await expect(page.getByText(/trabalho/i)).toBeVisible();
  });

  test("exibe percentuais dos scores", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await expect(page.getByText("85%")).toBeVisible();
    await expect(page.getByText("78%")).toBeVisible();
    await expect(page.getByText("70%")).toBeVisible();
  });

  test("exibe gráfico de radar SVG", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    const radar = page.locator("svg[role='img']");
    await expect(radar).toBeVisible();
  });

  test("mudar signo dispara nova requisição", async ({ page }) => {
    let callCount = 0;
    await page.route("**/api/compatibility**", (route) => {
      callCount++;
      void route.fulfill({
        status:      200,
        contentType: "application/json",
        body:        JSON.stringify(FAKE_COMPAT_SCORE),
      });
    });

    await page.goto(`${BASE_URL}/compatibilidade`);
    // Muda o sign2 de leo para taurus
    await page.locator("#sign2").selectOption("taurus");
    await page.waitForTimeout(500);
    expect(callCount).toBeGreaterThan(1);
  });
});

/* ─── Aba Sinastria ───────────────────────────────────────────────────────── */

test.describe("CompatibilityPage — aba Sinastria", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);

    await page.route("**/api/compatibility**", (route) => {
      void route.fulfill({
        status:      200,
        contentType: "application/json",
        body:        JSON.stringify(FAKE_COMPAT_SCORE),
      });
    });

    await page.route("**/api/synastry**", (route) => {
      void route.fulfill({
        status:      200,
        contentType: "application/json",
        body:        JSON.stringify(FAKE_SYNASTRY),
      });
    });
  });

  test("clicar em Sinastria exibe formulário de dados de nascimento", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await page.getByRole("tab", { name: /sinastria/i }).click();
    await expect(page.getByRole("presentation")).toContainText(/pessoa 1/i);
    await expect(page.getByRole("presentation")).toContainText(/pessoa 2/i);
  });

  test("preenchimento e cálculo de sinastria exibe aspectos", async ({ page }) => {
    await page.goto(`${BASE_URL}/compatibilidade`);
    await page.getByRole("tab", { name: /sinastria/i }).click();

    /* Preencher formulário */
    const inputs = await page.locator('input[type="date"]').all();
    if (inputs[0]) await inputs[0].fill("1990-03-15");
    if (inputs[1]) await inputs[1].fill("1988-08-20");

    const latInputs = await page.locator('input[placeholder*="Latitude"]').all();
    const lonInputs = await page.locator('input[placeholder*="Longitude"]').all();
    if (latInputs[0]) await latInputs[0].fill("-23.55");
    if (lonInputs[0]) await lonInputs[0].fill("-46.63");
    if (latInputs[1]) await latInputs[1].fill("-22.91");
    if (lonInputs[1]) await lonInputs[1].fill("-43.17");

    await page.getByRole("button", { name: /calcular sinastria/i }).click();
    await expect(page.getByRole("list")).toBeVisible({ timeout: 5000 });
  });
});

/* ─── Onboarding — não deve aparecer para usuários com onboardingDone=true ── */

test.describe("OnboardingOverlay — não aparece para usuário existente", () => {
  test("não exibe dialog de onboarding para user com onboardingDone=true", async ({ page }) => {
    await setupAuth(page);
    await page.goto(`${BASE_URL}/`);
    const dialog = page.getByRole("dialog");
    await expect(dialog).not.toBeVisible();
  });
});
