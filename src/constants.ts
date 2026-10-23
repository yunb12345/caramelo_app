export const APP_NAME = "Caramelo";
export const APP_VERSION = "1.0.3";
export const CURRENCY = "ARS";

export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "OTHER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

export const MANUAL_MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT"] as const;

export const MOVEMENT_TYPES = ["IN", "OUT", "ADJUSTMENT", "SALE", "RETURN"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  IN: "Ingreso",
  OUT: "Egreso",
  ADJUSTMENT: "Ajuste",
  SALE: "Venta",
  RETURN: "Devolucion",
};

export const SIZE_SUGGESTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "UNICO",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
];

export const CATEGORY_COLORS = [
  "#f97316",
  "#0ea5e9",
  "#ec4899",
  "#8b5cf6",
  "#10b981",
  "#e11d48",
  "#eab308",
  "#64748b",
  "#b86431",
  "#14b8a6",
];
