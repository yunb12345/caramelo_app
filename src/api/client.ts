import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { ApiErrorBody } from "../types";

const API_URL_KEY = "caramelo.apiUrl";
const TOKEN_KEY = "caramelo.token";

function detectDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;

  if (!hostUri) return null;

  const host = hostUri.split(":")[0];
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  if (host.endsWith("exp.host") || host.endsWith("expo.dev")) return null;

  return host;
}

export function getDefaultApiUrl(): string {
  const host = detectDevHost();

  if (host) return `http://${host}:3001/api`;
  if (Platform.OS === "android") return "http://10.0.2.2:3001/api";
  return "http://localhost:3001/api";
}

export const DEFAULT_API_URL = getDefaultApiUrl();

export function normalizeApiUrl(value: string): string {
  let url = value.trim();

  if (!url) return DEFAULT_API_URL;
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;

  url = url.replace(/\/+$/, "");
  if (!/\/api$/i.test(url)) url = `${url}/api`;

  return url;
}

export class ApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];

  constructor(message: string, status: number, issues?: { path: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

let apiBaseUrl = DEFAULT_API_URL;
let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export function getToken(): string | null {
  return authToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): () => void {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

export async function initApi(): Promise<{ apiUrl: string; token: string | null }> {
  const [storedUrl, storedToken] = await Promise.all([
    AsyncStorage.getItem(API_URL_KEY),
    AsyncStorage.getItem(TOKEN_KEY),
  ]);

  apiBaseUrl = storedUrl ? normalizeApiUrl(storedUrl) : DEFAULT_API_URL;
  authToken = storedToken;
  return { apiUrl: apiBaseUrl, token: authToken };
}

export async function persistApiUrl(value: string): Promise<string> {
  const url = normalizeApiUrl(value);
  apiBaseUrl = url;
  await AsyncStorage.setItem(API_URL_KEY, url);
  return url;
}

export async function persistToken(token: string | null): Promise<void> {
  authToken = token;

  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
};

const TIMEOUT_MS = 20_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      throw new ApiError("El servidor no respondio a tiempo. Revisa tu conexion.", 0);
    }
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa la direccion y tu conexion.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    if (!path.startsWith("/auth/login")) {
      authToken = null;
      void AsyncStorage.removeItem(TOKEN_KEY);
      unauthorizedHandler?.();
    }
  }

  if (!response.ok) {
    let payload: ApiErrorBody | null = null;

    try {
      payload = (await response.json()) as ApiErrorBody;
    } catch {
      payload = null;
    }

    const fallback =
      response.status === 401
        ? "Email o contrasena incorrectos"
        : `Error ${response.status}`;

    throw new ApiError(payload?.error ?? fallback, response.status, payload?.issues);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Comprueba que una URL responda el endpoint publico `/health`. */
export async function checkHealth(value: string): Promise<void> {
  const base = normalizeApiUrl(value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${base}/health`, { signal: controller.signal });

    if (!response.ok) {
      throw new ApiError(`El servidor respondio con estado ${response.status}`, response.status);
    }

    const body = (await response.json()) as { ok?: boolean };
    if (!body?.ok) throw new ApiError("El servidor no devolvio una respuesta valida", 0);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      "No se pudo conectar. Verifica que la API este encendida y la IP sea correcta.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}
