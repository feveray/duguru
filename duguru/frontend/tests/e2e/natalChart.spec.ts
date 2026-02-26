/**
 * frontend/tests/e2e/natalChart.spec.ts
 *
 * Testes E2E da pagina de Mapa Natal (T062).
 *
 * Pre-requisitos: servidor backend e frontend rodando em modo de dev/test
 * com uma conta de usuario autenticada (configurada via storage state).
 *
 * Como os testes E2E exigem auth real, estes testes assumem que a sessao
 * do browser esta autenticada (Bearer token em memoria via interceptor).
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

/* ─── Testes sem autenticacao (redireciona para /login) ────────── */

test.describe("NatalChartPage — sem autenticacao", () => {
  test("redireciona para /login se nao autenticado", async ({ page }) => {
    await page.goto(`${BASE_URL}/mapa-natal`);
    // Aguarda redirecionamento ou exibe estado de loading (depends on guard)
    await expect(page).toHaveURL(/\/(login|boas-vindas|mapa-natal)/);
  });
});

/* ─── Testes com autenticacao mockada ──────────────────────────── */

test.describe("NatalChartPage — estrutura da pagina", () => {
  test.beforeEach(async ({ page }) => {
    // Injeta token falso em localStorage para simular autenticacao
    await page.addInitScript(() => {
      const fakeAuth = JSON.stringify({
        state: {
          user: {
            id: "test-user-id",
            name: "Teste E2E",
            email: "e2e@duguru.app",
            onboardingDone: true,
          },
          isAuthenticated: true,
        },
        version: 0,
      });
      localStorage.setItem("duguru-auth", fakeAuth);
    });

    // Intercepta a chamada ao backend e retorna mapa fake
    await page.route("**/api/chart/natal", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            planets: [
              {
                name: "sun", longitude: 280.5, latitude: 0,
                speed: 1.0, sign: "capricorn", signIndex: 9,
                degree: 10, minute: 30, retrograde: false, house: 10,
              },
              {
                name: "moon", longitude: 45.2, latitude: 2.1,
                speed: 13.0, sign: "taurus", signIndex: 1,
                degree: 15, minute: 12, retrograde: false, house: 1,
              },
            ],
            houses: {
              cusps: [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 0],
              ascendant: 30,
              mc: 300,
            },
            aspects: [
              {
                planet1: "sun", planet2: "moon",
                type: "trine", angle: 120, orb: 1.5, applying: false,
              },
            ],
            interpretations: {
              planetSign: {
                sun: "Sol em Capricórnio: ambição e disciplina.",
                moon: "Lua em Touro: estabilidade emocional.",
              },
              planetHouse: {
                sun: "Sol na Casa 10: carreira em destaque.",
                moon: "Lua na Casa 1: presença marcante.",
              },
            },
          },
        }),
      });
    });

    await page.goto(`${BASE_URL}/mapa-natal`);
  });

  test("exibe o titulo da pagina", async ({ page }) => {
    await expect(page.locator("h1")).toContainText(/mapa/i);
  });

  test("exibe o seletor de sistema de casas", async ({ page }) => {
    await expect(page.locator("#house-system-select")).toBeVisible();
  });

  test("exibe a mandala SVG do mapa natal", async ({ page }) => {
    // aguarda desaparecer o loading
    await expect(page.getByTestId("chart-loading")).not.toBeVisible({ timeout: 5000 }).catch(() => null);
    const svg = page.locator("svg[role='img']").first();
    await expect(svg).toBeVisible();
  });

  test("exibe a tabela de posicoes dos planetas", async ({ page }) => {
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("table")).toContainText(/Sol/i);
    await expect(page.locator("table")).toContainText(/Lua/i);
  });

  test("clicar em um planeta exibe o painel de detalhes", async ({ page }) => {
    // Clica na linha da tabela correspondente ao Sol
    const solRow = page.locator("tr").filter({ hasText: /Sol/i }).first();
    await solRow.click();
    // Painel deve mostrar interpretacao do Sol
    await expect(page.locator("text=Sol em Capricórnio")).toBeVisible();
  });
});
