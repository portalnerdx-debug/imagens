import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

export const ROOT_DIR=path.resolve(__dirname,"..");
export const AUTH_DIR=path.join(ROOT_DIR,"playwright",".auth");
export const AUTH_FILE=path.join(AUTH_DIR,"click.json");

export const PORT=Number(process.env.PORT||8081);
export const CLICK_BASE_URL=(process.env.CLICK_BASE_URL||"https://plataformaclick.com.br").trim().replace(/\/$/,"");
export const CLICK_HEADLESS=String(process.env.CLICK_HEADLESS??"true").toLowerCase()==="true";
// Evita que o Chromium dependa do /dev/shm pequeno dos contêineres gratuitos.
export const CLICK_CHROMIUM_ARGS=["--disable-dev-shm-usage"];
export const CLICK_USERNAME=(process.env.CLICK_USERNAME||"").trim();
export const CLICK_PASSWORD=process.env.CLICK_PASSWORD||"";
// CPF padrão da consulta. Pode ser sobrescrito por CLICK_DEFAULT_CPF no ambiente.
export const CLICK_DEFAULT_CPF=(process.env.CLICK_DEFAULT_CPF||"10304987506").replace(/\D/g,"");
export const FIREBASE_PROJECT_ID=(process.env.FIREBASE_PROJECT_ID||"vendas-211b4").trim();
export const ALLOWED_ORIGINS=(process.env.ALLOWED_ORIGIN||"http://localhost:5173")
 .split(",")
 .map(origin=>origin.trim())
 .filter(Boolean);

export function requireClickCredentials(){
 if(!CLICK_USERNAME||!CLICK_PASSWORD)throw new Error("CLICK_CREDENTIALS_NOT_CONFIGURED");
}
