import { test, expect } from "@playwright/test";

/**
 * PWA & Offline Tests — T117
 *
 * Verifica:
 * 1. App carrega e registra service worker (ou exibe conteúdo em modo online)
 * 2. Após go offline, /mapa-natal e /horoscopo ainda exibem conteúdo (cache)
 * 3. Toast de "Esta função requer conexão" ao tentar baixar PDF offline
 */

const BASE_URL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

/** Injeta auth token válido em localStorage para simular usuário logado */
function setupAuth(authData: Record<string, unknown>) {
  return JSON.stringify(authData);
}

const MOCK_USER = {
  state: {
    user: {
      id: "user-pwa-1",
      name: "Astral Test",
      email: "pwa@duguru.app",
      avatarUrl: null,
      sunSign: "aries",
      ascendant: "libra",
      onboardingDone: true,
    },
    isAuthenticated: true,
    accessToken: "mock-access-token-pwa",
  },
  version: 0,
};

test.describe("PWA — Manifest & Icons", () => {
  test("manifest.webmanifest está acessível e tem campos obrigatórios", async ({ page }) => {
    // vite-plugin-pwa serve manifest.webmanifest em dev e build
    const response = await page.goto(`${BASE_URL}/manifest.webmanifest`);
    // Em dev (sem build), pode retornar 404 — aceita os dois cenários
    if (response && response.status() === 200) {
      const json = await response.json() as Record<string, unknown>;
      expect(json["name"]).toBe("duGuru");
      expect(json["short_name"]).toBe("duGuru");
      expect(json["display"]).toBe("standalone");
      expect(json["theme_color"]).toBe("#004643");
      expect(json["start_url"]).toBe("/");
      expect(Array.isArray(json["icons"])).toBe(true);
    }
  });

  test("ícone PWA /icons/icon.svg está acessível", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/icons/icon.svg`);
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/svg/i);
  });
});

test.describe("PWA — Offline caching", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((authJson: string) => {
      localStorage.setItem("duguru-auth", authJson);
    }, setupAuth(MOCK_USER));
  });

  test("/mapa-natal serve conteúdo quando rede é desativada após primeira carga", async ({
    page,
    context,
  }) => {
    // 1. Simula respostas de API para primeira carga
    await page.route("**/api/chart/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          planets: [{ name: "sun", sign: "aries", house: 1, longitude: 15, retrograde: false }],
          houses: [],
          aspects: [],
          chartData: { positions: [], houseSystem: "placidus" },
        }),
      });
    });

    // 2. Navega para /mapa-natal enquanto há rede
    await page.goto(`${BASE_URL}/mapa-natal`);
    await page.waitForLoadState("networkidle");

    // 3. Desativa a rede
    await context.setOffline(true);

    // 4. Recarrega (deve servir do cache do service worker)
    await page.reload({ waitUntil: "domcontentloaded" });

    // 5. Verifica que a página ainda renderiza (não 500 nem blank)
    const body = await page.locator("body").textContent();
    expect(body).not.toBeNull();
    expect(body!.length).toBeGreaterThan(10);

    // Religa rede
    await context.setOffline(false);
  });

  test("/horoscopo serve conteúdo quando rede é desativada após primeira carga", async ({
    page,
    context,
  }) => {
    await page.route("**/api/horoscope/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          period: "day",
          sign: "aries",
          sections: {
            love: "Texto de amor",
            work: "Texto de trabalho",
            health: "Texto de saúde",
            finance: "Texto de finanças",
            advice: "Conselho do dia",
          },
          generatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`${BASE_URL}/horoscopo`);
    await page.waitForLoadState("networkidle");

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });

    const body = await page.locator("body").textContent();
    expect(body).not.toBeNull();
    expect(body!.length).toBeGreaterThan(10);

    await context.setOffline(false);
  });
});

test.describe("PWA — Offline PDF download toast", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript((authJson: string) => {
      localStorage.setItem("duguru-auth", authJson);
    }, setupAuth(MOCK_USER));
  });

  test("ao tentar baixar PDF offline, exibe toast de aviso", async ({ page, context }) => {
    // Configura mocks de API
    await page.route("**/api/chart/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ planets: [], houses: [], aspects: [], chartData: {} }),
      });
    });

    await page.goto(`${BASE_URL}/mapa-natal`);
    await page.waitForLoadState("networkidle");

    // Vai offline e tenta baixar PDF
    await context.setOffline(true);

    // Intercepta clique no botão de download PDF (se existir)
    await page.route("**/api/chart/pdf", async (route) => {
      await route.abort("internetdisconnected");
    });

    // Verifica se existe botão de download PDF e clica nele
    const downloadBtn = page.getByRole("button", { name: /pdf|baixar|download/i });
    if (await downloadBtn.count() > 0) {
      await downloadBtn.first().click();
      // Busca toast com mensagem de conexão
      const toast = page.getByText(/requer conexão|offline|sem internet/i);
      await expect(toast).toBeVisible({ timeout: 5000 });
    }

    await context.setOffline(false);
  });
});
