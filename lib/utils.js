import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatName(name) {
  if (!name) return "";
  return name
    .replace(/\bnull\b/gi, "")
    .replace(/\bundefined\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDoctorName(name) {
  const cleanName = formatName(name);
  if (!cleanName) return "";
  if (cleanName.toLowerCase().startsWith("dr.") || cleanName.toLowerCase().startsWith("dr ")) {
    // Ensure it has a dot for consistency if it starts with Dr
    if (cleanName.toLowerCase().startsWith("dr ")) {
        return "Dr." + cleanName.substring(2);
    }
    return cleanName;
  }
  return `Dr. ${cleanName}`;
}
