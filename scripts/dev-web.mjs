/**
 * Levanta el proxy de la API y Expo web en un solo comando (`npm run web`).
 * Expo toma EXPO_PUBLIC_API_URL, asi que la app web usa el proxy local.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const proxyPort = process.env.API_PROXY_PORT ?? "3002";

process.env.EXPO_PUBLIC_API_URL ??= `http://localhost:${proxyPort}/api`;

const children = [];

function start(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    ...options,
  });

  children.push(child);
  child.on("error", (error) => {
    console.error(`No se pudo iniciar ${command}: ${error.message}`);
  });

  return child;
}

const projectRoot = join(scriptDir, "..");
const expoCli = join(projectRoot, "node_modules", "expo", "bin", "cli");

const proxy = start(process.execPath, [join(scriptDir, "api-proxy.mjs")]);
const expo = start(process.execPath, [expoCli, "start", "--web"]);

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) child.kill();
  }

  process.exit(code);
}

expo.on("exit", (code) => shutdown(code ?? 0));
proxy.on("exit", (code) => {
  if (!shuttingDown && code) shutdown(code);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
