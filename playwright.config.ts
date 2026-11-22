import { defineConfig, devices } from "@playwright/test";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Os testes E2E exigem o Supabase local. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY conforme `supabase status`.",
  );
}

const supabaseAddress = new URL(supabaseUrl);
if (
  supabaseAddress.protocol !== "http:" ||
  !["localhost", "127.0.0.1"].includes(supabaseAddress.hostname) ||
  supabaseAddress.port !== "54321"
) {
  throw new Error("Os testes E2E só podem usar o Supabase local em http://127.0.0.1:54321.");
}

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseKey,
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
