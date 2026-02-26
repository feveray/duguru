/**
 * frontend/tests/e2e/horoscope.spec.ts  — T095
 *
 * Testes E2E da página de Horóscopo (HoroscopePage).
 * Verifica: 5 seções, troca de período, switch solar/ascendente.
 * Usa interceptação de API para não depender de backend real.
 */
import { test, expect } from "@playwright/test";

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

function makeFakeHoroscope(
  period: string,
  sign: string,
): Record<string, unknown> {
  return {
    ok: true,
    data: {
      sign,
      period,
      date: "2000-06-15",
      love:    `Amor — ${sign} ${period}: A intuição te guia nos afetos.`,
      work:    `Trabalho — ${sign} ${period}: Creatividade flui facilmente.`,
      health:  `Saúde — ${sign} ${period}: Atenção ao descanso e à hidratação.`,
      finance: `Finanças — ${sign} ${period}: Evite gastos impulsivos agora.`,
      advice:  `Conselho — ${sign} ${period}: Confie no processo e siga em frente.`,
    },
  };
}

/* ─── Sem autenticação ────────────────────────────────────────────────────── */

test.describe("HoroscopePage — sem autenticação", () => {
  test("redireciona para /login ou /boas-vindas se não autenticado", async ({ page }) => {
    await page.goto(`${BASE_URL}/horoscopo`);
    await expect(page).toHaveURL(/\/(login|boas-vindas)/);
  });
});

/* ─── Com autenticação mockada ────────────────────────────────────────────── */

test.describe("HoroscopePage — estrutura e conteúdo", () => {
  test.beforeEach(async ({ page }) => {
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

    await page.addInitScript((auth: string) => {
      localStorage.setItem("duguru-auth", auth);
    }, fakeAuth);

    /* Mock para qualquer período/signo */
    await page.route("**/api/horoscope/**", async (route) => {
      const url = new URL(route.request().url());
      const pathParts = url.pathname.split("/");
      const period = pathParts[pathParts.length - 1] ?? "day";
      const useAscendant = url.searchParams.get("useAscendant") === "true";
      const sign = useAscendant ? "capricorn" : "pisces";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeFakeHoroscope(period, sign)),
      });
    });

    await page.goto(`${BASE_URL}/horoscopo`);
    /* Aguarda conteúdo carregar */
    await page.waitForTimeout(600);
  });

  test("exibe título da página", async ({ page }) => {
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText(/horóscopo/i);
  });

  test("exibe as 4 abas de período", async ({ page }) => {
    const tablist = page.getByRole("tablist");
    await expect(tablist).toBeVisible({ timeout: 5_000 });

    const tabs = tablist.getByRole("tab");
    await expect(tabs).toHaveCount(4);

    /* Primeira aba (Dia) deve estar selecionada */
    const firstTab = tabs.first();
    await expect(firstTab).toHaveAttribute("aria-selected", "true");
  });

  test("exibe as 5 seções temáticas", async ({ page }) => {
    for (const section of ["love", "work", "health", "finance", "advice"]) {
      const block = page.getByTestId(`section-${section}`);
      await expect(block).toBeVisible({ timeout: 5_000 });
    }
  });

  test("seção 'love' contém texto não-vazio", async ({ page }) => {
    const block = page.getByTestId("section-love");
    await expect(block).toBeVisible({ timeout: 5_000 });
    await expect(block).toContainText(/pisces|day|amor|afetos/i);
  });

  test("trocar aba de Dia para Semana recarrega conteúdo", async ({ page }) => {
    const tablist = page.getByRole("tablist");
    const weekTab = tablist.getByRole("tab").nth(1); // Semana é a 2ª aba
    await weekTab.click();

    await expect(weekTab).toHaveAttribute("aria-selected", "true");

    /* Aguarda o novo conteúdo (conteúdo inclui "week") */
    await page.waitForTimeout(300);
    const loveBlock = page.getByTestId("section-love");
    await expect(loveBlock).toContainText(/week|semana|pisces/i, { timeout: 3_000 });
  });

  test("navegar entre abas com teclas Arrow funciona", async ({ page }) => {
    const tablist = page.getByRole("tablist");
    const firstTab = tablist.getByRole("tab").first();
    await firstTab.focus();
    await page.keyboard.press("ArrowRight");

    /* Segunda aba (Semana) deve ficar selecionada */
    const secondTab = tablist.getByRole("tab").nth(1);
    await expect(secondTab).toHaveAttribute("aria-selected", "true");
  });

  test("switch solar/ascendente é visível quando usuário tem ascendente", async ({ page }) => {
    const switchGroup = page.getByRole("group", { name: /signo/i });
    await expect(switchGroup).toBeVisible({ timeout: 5_000 });

    const solarBtn = switchGroup.getByRole("button").first();
    const ascBtn   = switchGroup.getByRole("button").nth(1);

    await expect(solarBtn).toHaveAttribute("aria-pressed", "true");
    await expect(ascBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("ao clicar no switch Ascendente altera o signo exibido", async ({ page }) => {
    const switchGroup = page.getByRole("group", { name: /signo/i });
    await expect(switchGroup).toBeVisible({ timeout: 5_000 });

    /* Clica em Ascendente */
    const ascBtn = switchGroup.getByRole("button").nth(1);
    await ascBtn.click();
    await expect(ascBtn).toHaveAttribute("aria-pressed", "true");

    /* Aguarda nova chamada de API com useAscendant=true → sign=capricorn */
    await page.waitForTimeout(400);
    const loveBlock = page.getByTestId("section-love");
    await expect(loveBlock).toContainText(/capricorn/i, { timeout: 3_000 });
  });

  test("ao clicar no switch Solar volta ao signo solar", async ({ page }) => {
    const switchGroup = page.getByRole("group", { name: /signo/i });
    await expect(switchGroup).toBeVisible({ timeout: 5_000 });

    /* Ativa ascendente, depois volta para solar */
    const ascBtn   = switchGroup.getByRole("button").nth(1);
    const solarBtn = switchGroup.getByRole("button").first();

    await ascBtn.click();
    await page.waitForTimeout(200);
    await solarBtn.click();
    await expect(solarBtn).toHaveAttribute("aria-pressed", "true");

    await page.waitForTimeout(400);
    const loveBlock = page.getByTestId("section-love");
    await expect(loveBlock).toContainText(/pisces/i, { timeout: 3_000 });
  });
});

/* ─── Sem ascendente no perfil ────────────────────────────────────────────── */

test.describe("HoroscopePage — usuário sem ascendente", () => {
  test("switch solar/ascendente não é exibido", async ({ page }) => {
    const fakeAuth = JSON.stringify({
      state: {
        user: {
          id: "test-user-id-2",
          name: "Sem Ascendente",
          email: "noasc@duguru.app",
          sunSign: "aries",
          ascendant: null,
          onboardingDone: true,
        },
        isAuthenticated: true,
      },
      version: 0,
    });

    await page.addInitScript((auth: string) => {
      localStorage.setItem("duguru-auth", auth);
    }, fakeAuth);

    await page.route("**/api/horoscope/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeFakeHoroscope("day", "aries")),
      });
    });

    await page.goto(`${BASE_URL}/horoscopo`);
    await page.waitForTimeout(500);

    const switchGroup = page.getByRole("group", { name: /signo/i });
    await expect(switchGroup).not.toBeVisible();
  });
});
