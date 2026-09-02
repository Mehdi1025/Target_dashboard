import {
  addDays,
  addMinutes,
  format,
  getISODay,
  isBefore,
  parseISO,
  set,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";

export type RdvAvailabilityRule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
  label: string | null;
};

export type RdvBookableSlot = {
  iso: string;
  start: Date;
  end: Date;
  dayKey: string;
  timeLabel: string;
  dayLabel: string;
};

export const RDV_SLOT_HORIZON_DAYS = 21;

const DAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes ?? 0);
}

function normalizeBookedIso(iso: string): string {
  return parseISO(iso).toISOString();
}

/** Génère les créneaux libres sur l'horizon à partir des règles admin. */
export function generateBookableSlots(
  rules: RdvAvailabilityRule[],
  bookedIsoDates: string[],
  options?: { horizonDays?: number; now?: Date }
): RdvBookableSlot[] {
  const horizonDays = options?.horizonDays ?? RDV_SLOT_HORIZON_DAYS;
  const now = options?.now ?? new Date();
  const booked = new Set(bookedIsoDates.map(normalizeBookedIso));
  const activeRules = rules.filter((rule) => rule.is_active);
  const slots: RdvBookableSlot[] = [];

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const day = addDays(startOfDay(now), offset);
    const isoDay = getISODay(day);

    for (const rule of activeRules.filter((r) => r.day_of_week === isoDay)) {
      const startMin = parseTimeToMinutes(rule.start_time.slice(0, 5));
      const endMin = parseTimeToMinutes(rule.end_time.slice(0, 5));
      const duration = rule.slot_duration_minutes;

      for (let cursor = startMin; cursor + duration <= endMin; cursor += duration) {
        const slotStart = set(day, {
          hours: Math.floor(cursor / 60),
          minutes: cursor % 60,
          seconds: 0,
          milliseconds: 0,
        });

        if (isBefore(slotStart, now)) continue;

        const iso = slotStart.toISOString();
        if (booked.has(iso)) continue;

        slots.push({
          iso,
          start: slotStart,
          end: addMinutes(slotStart, duration),
          dayKey: format(slotStart, "yyyy-MM-dd"),
          timeLabel: format(slotStart, "HH:mm", { locale: fr }),
          dayLabel: format(slotStart, "EEE d MMM", { locale: fr }),
        });
      }
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Retire les créneaux qui chevauchent l'agenda occupé (Google Calendar d'Adam). */
export function filterSlotsByBusyIntervals(
  slots: RdvBookableSlot[],
  busyIntervals: { start: Date; end: Date }[]
): RdvBookableSlot[] {
  if (busyIntervals.length === 0) return slots;

  return slots.filter((slot) => {
    return !busyIntervals.some(
      (busy) => slot.start < busy.end && slot.end > busy.start
    );
  });
}

export function groupSlotsByDay(
  slots: RdvBookableSlot[]
): Map<string, RdvBookableSlot[]> {
  const map = new Map<string, RdvBookableSlot[]>();
  for (const slot of slots) {
    const list = map.get(slot.dayKey) ?? [];
    list.push(slot);
    map.set(slot.dayKey, list);
  }
  return map;
}

export function isSlotStillAvailable(
  slotIso: string,
  rules: RdvAvailabilityRule[],
  bookedIsoDates: string[],
  now: Date = new Date()
): boolean {
  const available = generateBookableSlots(rules, bookedIsoDates, { now });
  return available.some((slot) => slot.iso === normalizeBookedIso(slotIso));
}

export function getDayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? `Jour ${dayOfWeek}`;
}

export function formatTimeValue(time: string): string {
  return time.slice(0, 5);
}
