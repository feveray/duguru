/**
 * frontend/tests/e2e/dashboard.spec.ts  — T082
 *
 * Testes E2E da página principal (HomePage / Dashboard).
 * Verifica os 5 blocos: DailyPlanet, MoonPhase, DailyQuote, AlertBanner, CompatTop3.
 *
 * Usa interceptação de API para não depender de backend real.
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

const FAKE_DAILY_CONTENT = {
  ok: true,
  data: {
    planet: "Júpiter",
    influence: "Expansão, otimismo e crescimento pessoal estão em destaque.",
    moonPhase: {
      name: "full_moon",
      illumination: 99,
      julianDay: 2451545.0,
      nextNewMoon: 2451559.0,
      nextFullMoon: 2451574.0,
    },
    quote: "A vida é a arte do encontro, embora haja tanto desencontro pela vida.",
    quoteDate: "2000-01-01",
    alerts: [
      {
        event: "Mercúrio Retrógrado",
        startDate: "2000-01-01",
        endDate: "2000-01-21",
        signs: ["Gêmeos", "Virgem"],
        tip: "Evite assinar contratos; revise comunicações.",
      },
    ],
    compatTop3: [
      { sign: "leo",          romance: 92, friendship: 88, work: 85, summary: "Energia e paixão." },
      { sign: "sagittarius",  romance: 89, friendship: 91, work: 80, summary: "Aventura e liberdade." },
      { sign: "aries",        romance: 87, friendship: 85, work: 82, summary: "Fogo e ação." },
    ],
  },
};

/* ─── Sem autenticação ────────────────────────────────────────────────────── */

test.describe("HomePage — sem autenticação", () => {
  test("redireciona para /login ou /boas-vindas se não autenticado", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page).toHaveURL(/\/(login|boas-vindas)/);
  });
});

/* ─── Com autenticação mockada ────────────────────────────────────────────── */

test.describe("HomePage — blocos do dashboard", () => {
  test.beforeEach(async ({ page }) => {
    /* Injeta estado de auth fake no localStorage */
    await page.addInitScript(() => {
      const fakeAuth = JSON.stringify({
        state: {
          user: {
            id: "test-user-id",
            name: "Usuário Teste",
            email: "e2e@duguru.app",
            sunSign: "pisces",
            ascendant: "capricorn",
            onboardingDone: true,
          },
          isAuthenticated: true,
        },
        version: 0,
      });
      localStorage.setItem("duguru-auth", fakeAuth);
    });

    /* Intercepta GET /api/daily */
    await page.route("**/api/daily", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(FAKE_DAILY_CONTENT),
      });
    });

    await page.goto(`${BASE_URL}/`);
    /* Aguarda o conteúdo carregar (skeleton desaparece) */
    await page.waitForTimeout(500);
  });

  test("exibe o bloco DailyPlanet com nome do planeta", async ({ page }) => {
    const block = page.getByTestId("daily-planet");
    await expect(block).toBeVisible({ timeout: 5_000 });
    await expect(block).toContainText("Júpiter");
  });

  test("exibe o bloco MoonPhase com fase lunar", async ({ page }) => {
    const block = page.getByTestId("moon-phase");
    await expect(block).toBeVisible({ timeout: 5_000 });
    /* Deve conter texto da fase — "Lua Cheia" mapeado de full_moon */
    await expect(block).toContainText(/lua cheia/i);
  });

  test("expandir MoonPhase mostra detalhes adicionais", async ({ page }) => {
    const block = page.getByTestId("moon-phase");
    await expect(block).toBeVisible({ timeout: 5_000 });

    /* Botão expandir (ocupa toda a primeira linha) */
    const expandBtn = block.locator("button").first();
    await expect(expandBtn).toHaveAttribute("aria-expanded", "false");
    await expandBtn.click();
    await expect(expandBtn).toHaveAttribute("aria-expanded", "true");

    /* Após expandir, deve aparecer a dica */
    await expect(block).toContainText(/intenções|renovação|energia|objetivos/i, { timeout: 2_000 });
  });

  test("exibe o bloco DailyQuote com trecho da frase", async ({ page }) => {
    const block = page.getByTestId("daily-quote");
    await expect(block).toBeVisible({ timeout: 5_000 });
    await expect(block).toContainText(/encontro/i);
  });

  test("exibe o bloco AlertBanner com evento de Mercúrio Retrógrado", async ({ page }) => {
    const section = page.getByTestId("alert-banner");
    await expect(section).toBeVisible({ timeout: 5_000 });
    await expect(section).toContainText(/Mercúrio Retrógrado/i);
    await expect(section).toContainText(/Evite assinar/i);
  });

  test("exibe o bloco CompatTop3 com os 3 signos compatíveis", async ({ page }) => {
    const section = page.getByTestId("compat-top3");
    await expect(section).toBeVisible({ timeout: 5_000 });
    await expect(section).toContainText(/Leão/i);
    await expect(section).toContainText(/Sagitário/i);
    await expect(section).toContainText(/Áries/i);
  });

  test("CompatTop3 mostra barras de pontuação", async ({ page }) => {
    const section = page.getByTestId("compat-top3");
    await expect(section).toBeVisible({ timeout: 5_000 });
    /* Cada signo tem 3 barras (romance, amizade, trabalho) */
    const bars = section.locator("[class*='flex-1']");
    await expect(bars).toHaveCount(9, { timeout: 3_000 }); // 3 signos × 3 barras
  });

  test("CompatTop3 tem link para /compatibilidade", async ({ page }) => {
    const section = page.getByTestId("compat-top3");
    await expect(section).toBeVisible({ timeout: 5_000 });
    const link = section.getByRole("link");
    await expect(link).toBeDefined();
    const href = await link.first().getAttribute("href");
    expect(href).toMatch(/compatibilidade/);
  });
});
