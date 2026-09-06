import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function shortDate(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleString("en-IN", { month: "short" }).toUpperCase(),
  };
}

/* DV8 (shared.jsx placeLabel) — how a person's location reads anywhere in the app:
   "City, Country" once the country is known, bare city otherwise. City and country
   are stored separately (CityField reports both); this is the ONLY place they're
   joined for display. */
export function placeLabel(u: { city?: string | null; country?: string | null } | null | undefined): string {
  if (!u?.city) return "";
  return u.country ? `${u.city}, ${u.country}` : u.city;
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
