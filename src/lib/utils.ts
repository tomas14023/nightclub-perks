import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildWaUrl(message: string, phone?: string) {
  const base = "https://wa.me/";
  const cleaned = (phone ?? "").replace(/[^\d]/g, "");
  return `${base}${cleaned}?text=${encodeURIComponent(message)}`;
}

export function formatPhone(p: string) {
  return p.replace(/[^\d+]/g, "");
}
