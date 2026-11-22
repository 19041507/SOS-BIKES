import { expect, test, type Page } from "@playwright/test";
import { E2E_PASSWORD, e2eAccounts } from "./global-setup";

async function dismissLocationPrompt(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("sos-bikes:localizacao-perguntada", "1");
  });
}

async function loginAsCyclist(page: Page) {
  await dismissLocationPrompt(page);
  await page.goto("/");
  await page.getByLabel("E-mail").fill(e2eAccounts.cyclist.email);
  await page.getByLabel("Senha").fill(e2eAccounts.cyclist.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Sua bike deu problema no caminho?" })).toBeVisible();
}

test("faz login e acessa a área do ciclista", async ({ page }) => {
  await dismissLocationPrompt(page);
  await page.goto("/");
  await page.getByLabel("E-mail").fill(e2eAccounts.cyclist.email);
  await page.getByLabel("Senha").fill(e2eAccounts.cyclist.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/ciclista$/);
  await expect(page.getByRole("heading", { name: "Sua bike deu problema no caminho?" })).toBeVisible();
});

test("cria uma conta de ciclista", async ({ page }) => {
  await dismissLocationPrompt(page);
  await page.goto("/cadastro");
  await page.getByLabel("Nome completo").fill("Nova Pessoa E2E");
  await page.getByLabel("WhatsApp").fill("81999990000");
  await page.getByLabel("E-mail").fill(`novo-${Date.now()}@sosbikes.test`);
  await page.getByLabel("Senha").fill(E2E_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/ciclista$/);
  await expect(page.getByRole("heading", { name: "Sua bike deu problema no caminho?" })).toBeVisible();
});

test("envia pedido de socorro a um mecânico disponível", async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
  await loginAsCyclist(page);
  await page.getByRole("button", { name: "Preciso de socorro" }).click();
  await page.getByRole("button", { name: "Pneu furado" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Endereço ou ponto de referência").fill("Rua do Sossego, 100, Boa Vista, Recife");
  await page.getByRole("button", { name: "Buscar mecânicos disponíveis" }).click();

  await expect(page.getByText(e2eAccounts.mechanic.name)).toBeVisible();
  await page.getByRole("button", { name: "Solicitar" }).click();

  await expect(page.getByRole("heading", { name: `Aguardando ${e2eAccounts.mechanic.name.split(" ")[0]}` })).toBeVisible();
  await expect(page.getByText(/Seu chamado foi enviado/)).toBeVisible();
});
