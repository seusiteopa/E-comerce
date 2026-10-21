import { test, expect } from "@playwright/test";

test("a home da plataforma abre e mostra o convite para criar loja", async ({ page }) => {
  await page.goto("/inicio-plataforma");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("vender online");
  await expect(page.getByRole("link", { name: /primeiro mês grátis/i }).first()).toBeVisible();
});

test("a página de entrada mostra e-mail e senha", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/e-mail/i)).toBeVisible();
  await expect(page.getByLabel(/senha/i)).toBeVisible();
});

test("a vitrine da Vecorion abre sem erro", async ({ page }) => {
  const response = await page.goto("/lojas/vecorion");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("body")).not.toContainText("Application error");
});

test("o checkout mostra só Pix como forma de pagamento", async ({ page }) => {
  await page.goto("/lojas/vecorion/produtos/o-que-seu-corpo-esta-tentando-dizer");
  await page.getByRole("button", { name: /comprar agora/i }).first().click();
  await expect(page).toHaveURL(/checkout/);
  await expect(page.getByText("Pix", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Cartão de crédito")).toHaveCount(0);
  await expect(page.getByText("Boleto")).toHaveCount(0);
});
