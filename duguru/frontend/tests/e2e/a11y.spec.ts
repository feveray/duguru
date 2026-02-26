import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility Tests — T120 + T121
 *
 * Verifica zero violações axe-core A/AA em todas as páginas públicas e autenticadas.
 * Inclui verificação de contraste de cores (axe rule: color-contrast).
 *
 * Executa em chromium; falha se qualquer violação WCAG A ou AA for encontrada.
 */

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

const MOCK_USER = {
  state: {
    user: {
      id: "user-a11y-1",
      name: "Acessível Teste",
      email: "a11y@duguru.app",
      avatarUrl: null,
      sunSign: "taurus",
      ascendant: "scorpio",
      onboardingDone: true,
    },
    isAuthenticated: true,
    accessToken: "mock-access-token-a11y",
  },
  version: 0,
};

/** Configura auth antes de cada teste autenticado */
async function setupAuth(context: import("@playwright/test").BrowserContext) {
  await context.addInitScript((authJson: string) => {
    localStorage.setItem("duguru-auth", authJson);
  }, JSON.stringify(MOCK_USER));
}

/** Executa análise axe e asserção de zero violações, descrevendo cada uma */
async function assertNoA11yViolations(page: import("@playwright/test").Page, tags: string[] = ["wcag2a", "wcag2aa"]) {
  const results = await new AxeBuilder({ page })
    .withTags(tags)
    // Exclui regiões dinâmicas de carregamento (skeleton) que podem ter contraste temporário
    .exclude("[aria-hidden='true']")
    .analyze();

  if (results.violations.length > 0) {
    const details = results.violations.map((v) =>
      `[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}\n  Nodes: ${v.nodes
        .slice(0, 2)
        .map((n) => n.html)
        .join(", ")}`
    ).join("\n\n");
    expect.soft(results.violations, `Violações de acessibilidade:\n\n${details}`).toHaveLength(0);
  }

  expect(results.violations).toHaveLength(0);
}

// ─── Páginas Públicas ───────────────────────────────────────────────────────

test.describe("A11y — Páginas públicas", () => {
  test("WelcomePage (/boas-vindas) — sem violações WCAG A/AA", async ({ page }) => {
    await page.goto(`${BASE_URL}/boas-vindas`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });

  test("LoginPage (/login) — sem violações WCAG A/AA", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });

  test("RegisterPage (/cadastro) — sem violações WCAG A/AA", async ({ page }) => {
    await page.goto(`${BASE_URL}/cadastro`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });

  test("ForgotPasswordPage (/esqueci-a-senha) — sem violações WCAG A/AA", async ({ page }) => {
    await page.goto(`${BASE_URL}/esqueci-a-senha`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });
});

// ─── Páginas Autenticadas ───────────────────────────────────────────────────

test.describe("A11y — Páginas autenticadas", () => {
  test.beforeEach(async ({ context }) => {
    await setupAuth(context);
  });

  test("HomePage (/) — sem violações WCAG A/AA", async ({ page }) => {
    // Simula API calls do dashboard
    await page.route("**/api/daily", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          planetOfDay: { name: "venus", sign: "taurus", degree: 12, retrograde: false },
          moonPhase: { phase: "waxing_gibbous", illumination: 0.65, emoji: "🌔" },
          dailyQuote: { text: "O céu é infinito.", author: "Cósmica" },
          alerts: [],
          compatTop3: [],
        }),
      });
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });

  test("NatalChartPage (/mapa-natal) — sem violações WCAG A/AA", async ({ page }) => {
    await page.route("**/api/chart/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          planets: [{ name: "sun", sign: "taurus", house: 1, longitude: 45, retrograde: false }],
          houses: [],
          aspects: [],
          chartData: { positions: [], houseSystem: "placidus" },
        }),
      });
    });

    await page.goto(`${BASE_URL}/mapa-natal`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });

  test("HoroscopePage (/horoscopo) — sem violações WCAG A/AA", async ({ page }) => {
    await page.route("**/api/horoscope/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          period: "day",
          sign: "taurus",
          sections: {
            love: "Amor está em alta.",
            work: "Foco no trabalho.",
            health: "Cuide da saúde.",
            finance: "Finanças estáveis.",
            advice: "Confie no processo.",
          },
          generatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${BASE_URL}/horoscopo`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });

  test("CompatibilityPage (/compatibilidade) — sem violações WCAG A/AA", async ({ page }) => {
    await page.route("**/api/compatibility**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "1",
          sign1: "taurus",
          sign2: "virgo",
          overall: 88,
          romance: 85,
          friendship: 90,
          work: 88,
          description: "Combinação excelente.",
        }),
      });
    });

    await page.goto(`${BASE_URL}/compatibilidade`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });

  test("ProfilePage (/perfil) — sem violações WCAG A/AA", async ({ page }) => {
    await page.route("**/api/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "user-a11y-1",
            name: "Acessível Teste",
            email: "a11y@duguru.app",
            avatarUrl: null,
            birthDate: "1990-04-20",
            birthTime: "12:00",
            birthCity: "São Paulo",
            birthCountry: "BR",
            birthLat: -23.55,
            birthLon: -46.63,
            timezone: "America/Sao_Paulo",
            houseSystem: "placidus",
            sunSign: "taurus",
            ascendant: "scorpio",
            onboardingDone: true,
          },
        }),
      });
    });

    await page.goto(`${BASE_URL}/perfil`);
    await page.waitForLoadState("networkidle");
    await assertNoA11yViolations(page);
  });
});

// ─── Contraste de Cores — Ambos os Temas ──────────────────────────────────

test.describe("A11y — Contraste de cores (T121)", () => {
  test("WelcomePage — tema claro: contraste adequado", async ({ page }) => {
    await page.goto(`${BASE_URL}/boas-vindas`);
    await page.waitForLoadState("networkidle");

    // Garante tema claro
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
    });

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

  test("WelcomePage — tema escuro: contraste adequado", async ({ page }) => {
    await page.goto(`${BASE_URL}/boas-vindas`);
    await page.waitForLoadState("networkidle");

    // Aplica tema escuro
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    });

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

  test("LoginPage — tema claro: contraste adequado", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });

  test("LoginPage — tema escuro: contraste adequado", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark");
    });

    const results = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    expect(results.violations).toHaveLength(0);
  });
});
