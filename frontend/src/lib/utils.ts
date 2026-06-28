import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BadgeProps } from "@/components/ui/badge";
import type { Plant, CareType, Species } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date instead of UTC.
 * This prevents timezone conversion issues where "2025-01-01" would
 * display as "Dec 31, 2024" in negative UTC offset timezones.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Return today's date (YYYY-MM-DD) in the user's local timezone.
 * Used as the default value for date inputs and care-log care_date.
 */
export function getTodayLocal(): string {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export interface UrgencyInfo {
  label: string;
  variant: BadgeVariant;
  className: string;
}

/**
 * Map a days-until-due value to a badge label, variant, and accent classes.
 * Shared by the Dashboard upcoming-care list and the plant grid cards.
 */
export function getUrgencyInfo(daysUntilDue: number): UrgencyInfo {
  if (daysUntilDue < 0) {
    return {
      label: "Overdue",
      variant: "destructive",
      className:
        "border-destructive/50 bg-destructive text-destructive-foreground",
    };
  }
  if (daysUntilDue === 0) {
    return {
      label: "Due Today",
      variant: "warning",
      className:
        "border-yellow-600/50 bg-yellow-500 text-white dark:bg-yellow-600 dark:text-white",
    };
  }
  return {
    label: `Due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`,
    variant: "success",
    className:
      "border-green-600/50 bg-green-500 text-white dark:bg-green-600 dark:text-white",
  };
}

/**
 * Look up a plant's nickname by id. Falls back to "Plant #<id>".
 */
export function getPlantName(plants: Plant[], plantId: number): string {
  const plant = plants.find((p) => p.id === plantId);
  return plant?.nickname || `Plant #${plantId}`;
}

/**
 * Look up a care type's name by id. Falls back to "Care Type #<id>".
 */
export function getCareTypeName(
  careTypes: CareType[],
  careTypeId: number,
): string {
  const careType = careTypes.find((ct) => ct.id === careTypeId);
  return careType?.name || `Care Type #${careTypeId}`;
}

/**
 * Look up a species' common name by id. Falls back to "Unknown species".
 */
export function getSpeciesName(
  species: Species[],
  speciesId: number | undefined,
): string {
  if (!speciesId) return "No species";
  const s = species.find((sp) => sp.id === speciesId);
  return s?.common_name || "Unknown species";
}

/**
 * Extract a human-readable message from a caught error, preferring an API
 * response `error`/`message` field.
 *
 * Falls back to the provided string.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (
      err as { response?: { data?: { error?: string; message?: string } } }
    ).response?.data;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
