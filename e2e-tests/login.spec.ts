import { test, expect } from "@playwright/test";

test("user can sign up, log in, and reach the home page", async ({ page }) => {
  // Start at the welcome page
  await page.goto("/");

  // Verify welcome page is shown
  await expect(page.getByText("Bem-vindo ao Appoio")).toBeVisible();

  // Click "Criar conta" to go to signup
  await page.getByRole("button", { name: "Criar conta" }).click();

  // Verify signup page is shown
  await expect(page.getByText("Criar conta")).toBeVisible();

  // Fill in signup form
  await page.getByLabel("Nome completo").fill("Maria Silva");
  await page.getByLabel("CPF").fill("12345678909");
  await page.getByLabel("Telefone (WhatsApp)").fill("21912345678");
  await page.locator("#senha").fill("testpass123");
  await page.locator("#confirmarSenha").fill("testpass123");

  // Select user type: Cliente
  await page.getByRole("button", { name: "Cliente" }).click();

  // Submit signup
  await page.getByRole("button", { name: "Confirmar cadastro" }).click();

  // Should be redirected to login page
  await expect(page).toHaveURL("/login");

  // Fill in login credentials
    await page.getByLabel("Nome", { exact: true }).fill("Maria Silva");
    await page.locator("#senha").fill("testpass123");

  // Submit login
  await page.getByRole("button", { name: "Entrar" }).click();

  // Should be redirected to the home page (tela-inicial)
  await expect(page).toHaveURL("/tela-inicial");

  // Verify the home page shows the user name
  await expect(page.getByText("Maria Silva")).toBeVisible();
});