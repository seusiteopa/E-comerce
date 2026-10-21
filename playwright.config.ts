import { defineConfig } from "@playwright/test";

// Rode com: BASE_URL=https://vecorion.netlify.app npx playwright test
// (ou a URL da prévia). Sem BASE_URL, sobe o site local com "npm run start".
const baseURL = process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "celular", use: { viewport: { width: 390, height: 844 } } }],
  webServer: process.env.BASE_URL ? undefined : { command: "npm run start", url: "http://localhost:3000", reuseExistingServer: true },
});
