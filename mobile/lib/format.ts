import dayjs from "dayjs";
import calendar from "dayjs/plugin/calendar";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.extend(calendar);

/** "7:42 PM" — under chat bubbles. */
export const messageTime = (iso: string) => dayjs(iso).format("h:mm A");

/** Chat-list right column: "Now", "5m", "7:42 PM", "Yesterday", "Mon", "12 Jul". */
export function listTime(iso: string): string {
  const d = dayjs(iso);
  const now = dayjs();
  const mins = now.diff(d, "minute");
  if (mins < 1) return "Now";
  if (mins < 60) return `${mins}m`;
  if (d.isSame(now, "day")) return d.format("h:mm A");
  if (d.isSame(now.subtract(1, "day"), "day")) return "Yesterday";
  if (now.diff(d, "day") < 7) return d.format("ddd");
  return d.format("D MMM");
}

export function dayLabel(iso: string): string {
  const d = dayjs(iso);
  const now = dayjs();
  if (d.isSame(now, "day")) return "Today";
  if (d.isSame(now.subtract(1, "day"), "day")) return "Yesterday";
  return d.format("dddd, D MMMM");
}

/** "Sat, 11 Jul · 7:00 PM" — event cards. */
export const eventWhen = (iso: string) =>
  dayjs(iso).format("ddd, D MMM · h:mm A");

/** "Last seen 5 minutes ago" (falls back to nothing when unknown). */
export function lastSeen(iso: string | null): string | null {
  if (!iso) return null;
  return `Last seen ${dayjs(iso).fromNow()}`;
}
