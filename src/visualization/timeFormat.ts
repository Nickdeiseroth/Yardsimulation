export const DAY_MINUTES = 24 * 60;

/** Formatiert Minuten seit Mitternacht (ggf. > 1440 bei mehreren Tagen) als Uhrzeit HH:MM des jeweiligen Tages. */
export function formatClock(minutes: number): string {
  const minutesOfDay = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = Math.floor(minutesOfDay / 60)
    .toString()
    .padStart(2, '0');
  const m = Math.floor(minutesOfDay % 60)
    .toString()
    .padStart(2, '0');
  return `${h}:${m}`;
}
