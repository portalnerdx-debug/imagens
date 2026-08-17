import fs from "node:fs";
import readline from "node:readline/promises";
import { chromium } from "playwright";
import { AUTH_DIR, AUTH_FILE, CLICK_BASE_URL } from "./config.js";

fs.mkdirSync(AUTH_DIR, { recursive: true });
const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();

console.log("Abrindo Plataforma Click...");
await page.goto(CLICK_BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
console.log("Faça login manualmente na janela aberta.");
console.log("Quando chegar à tela principal, volte ao PowerShell.");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await rl.question("Pressione ENTER para salvar a sessão...");
rl.close();

await context.storageState({ path: AUTH_FILE });
await browser.close();
console.log(`Sessão salva em: ${AUTH_FILE}`);
