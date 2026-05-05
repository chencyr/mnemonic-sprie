import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

export async function withGamePage(testBody, { port = 5174 } = {}) {
  const server = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, CI: "1" }
  });
  const output = [];
  server.stdout.on("data", (chunk) => output.push(chunk.toString()));
  server.stderr.on("data", (chunk) => output.push(chunk.toString()));
  try {
    await waitForServer(`http://127.0.0.1:${port}/`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/?e2e=1`, { waitUntil: "networkidle" });
    await testBody({ page, consoleErrors });
    await browser.close();
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
    }
  } finally {
    server.kill("SIGTERM");
  }
  return output.join("");
}

export async function state(page) {
  await page.waitForFunction(() => typeof window.render_game_to_text === "function");
  return JSON.parse(await page.evaluate(() => window.render_game_to_text()));
}

export async function clickButton(page, id) {
  const current = await state(page);
  const button = current.buttons.find((item) => item.id === id);
  if (!button) throw new Error(`Button not found: ${id}\n${JSON.stringify(current, null, 2)}`);
  if (!button.enabled) throw new Error(`Button is disabled: ${id}`);
  await page.mouse.click(button.x, button.y);
  await page.waitForTimeout(50);
  return state(page);
}

export async function screenshot(page, name) {
  await mkdir("output/e2e", { recursive: true });
  await page.screenshot({ path: `output/e2e/${name}.png`, fullPage: false });
}

export function assertVisibleAssetPrefix(current, prefix, mode) {
  const found = current.visibleAssets?.some((asset) => asset.key.startsWith(prefix));
  if (!found) {
    throw new Error(`Expected visible asset prefix ${prefix} in ${mode}.\n${JSON.stringify(current.visibleAssets, null, 2)}`);
  }
}

export function assertVisibleAssetRole(current, role, mode) {
  const found = current.visibleAssets?.some((asset) => asset.role === role || asset.role.startsWith(`${role}:`));
  if (!found) {
    throw new Error(`Expected visible asset role ${role} in ${mode}.\n${JSON.stringify(current.visibleAssets, null, 2)}`);
  }
}

export function firstEnabledButton(current, prefix) {
  const button = current.buttons.find((item) => item.id.startsWith(prefix) && item.enabled);
  if (!button) throw new Error(`No enabled button with prefix ${prefix}`);
  return button;
}

async function waitForServer(url) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}
