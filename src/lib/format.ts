import { CURRENCY } from "../constants";

let moneyFormatter: Intl.NumberFormat | null = null;
let numberFormatter: Intl.NumberFormat | null = null;

try {
  moneyFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  numberFormatter = new Intl.NumberFormat("es-AR");
} catch {
  moneyFormatter = null;
  numberFormatter = null;
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "-";
  try {
    if (moneyFormatter) return moneyFormatter.format(value);
    return `$ ${value.toFixed(2)}`;
  } catch {
    return `$ ${value.toFixed(2)}`;
  }
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "-";
  try {
    if (numberFormatter) return numberFormatter.format(value);
    return String(value);
  } catch {
    return String(value);
  }
}

/** Formato compacto para graficos: 1.2k / 15k. */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}

const DAYS = ["dom", "lun", "mar", "mie", "jue", "vie", "sab"];
const DAYS_LONG = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const MONTHS_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** `2026-10-22` -> `jue 22`. */
export function formatDayShort(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return `${DAYS[date.getDay()]} ${date.getDate()}`;
}

/** Fecha larga en espanol: `jueves 22 de octubre`. */
export function formatLongDate(date: Date = new Date()): string {
  return `${DAYS_LONG[date.getDay()]} ${date.getDate()} de ${MONTHS_LONG[date.getMonth()]}`;
}

/** Devuelve YYYY-MM-DD en horario local. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type DateRangePreset = "today" | "week" | "month" | "all";

export function dateRangeFor(preset: DateRangePreset): { from?: string; to?: string } {
  if (preset === "all") return {};

  const to = new Date();
  const from = new Date();

  if (preset === "week") from.setDate(from.getDate() - 6);
  if (preset === "month") from.setDate(from.getDate() - 29);
  if (preset === "today") from.setHours(0, 0, 0, 0);

  return { from: toDateKey(from), to: toDateKey(to) };
}

/** Convierte texto de input a numero. Acepta coma o punto decimal. */
export function parseNumber(value: string): number | null {
  const clean = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!clean) return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseIntSafe(value: string, fallback = 0): number {
  const parsed = parseInt(value.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
