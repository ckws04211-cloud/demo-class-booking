import { classes, getClass, type ClassItem } from "./catalog";

/** 모든 시간은 한국 시간(KST, UTC+9) 기준 */
const KST = 9 * 3600_000;
export const BOOKING_DAYS = 21;
export const CLOSED_WEEKDAY = 1; // 월요일 휴무
export const HOLD_MINUTES = 10; // 결제 대기 좌석 홀드 시간
export const CANCEL_DEADLINE_HOURS = 24;

const pad = (n: number) => String(n).padStart(2, "0");

/** KST 기준 날짜 문자열 YYYY-MM-DD */
export function kstDate(d: Date) {
  const k = new Date(d.getTime() + KST);
  return `${k.getUTCFullYear()}-${pad(k.getUTCMonth() + 1)}-${pad(k.getUTCDate())}`;
}

/** KST 날짜 + 시각 → 실제 시각(Date) */
export function kstToDate(date: string, time: string) {
  return new Date(`${date}T${time}:00+09:00`);
}

export type Session = { id: string; classSlug: string; date: string; time: string; at: string; capacity: number };

export const sessionId = (slug: string, date: string, time: string) => `${slug}_${date.replace(/-/g, "")}_${time.replace(":", "")}`;

export function parseSessionId(id: string): Session | null {
  const m = /^([a-z-]+)_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})$/.exec(id);
  if (!m) return null;
  const c = getClass(m[1]);
  if (!c) return null;
  const date = `${m[2]}-${m[3]}-${m[4]}`;
  const time = `${m[5]}:${m[6]}`;
  if (!c.slots.includes(time)) return null;
  const at = kstToDate(date, time);
  if (new Date(`${date}T12:00:00+09:00`).getUTCDay() === CLOSED_WEEKDAY) return null;
  return { id, classSlug: c.slug, date, time, at: at.toISOString(), capacity: c.capacity };
}

/** 예약 가능한 날짜 목록 (오늘부터 BOOKING_DAYS일, 월요일 제외) */
export function bookingDates(now = new Date()) {
  const out: { date: string; weekday: number }[] = [];
  const today = kstDate(now);
  for (let i = 0; i < BOOKING_DAYS; i++) {
    const d = new Date(`${today}T12:00:00+09:00`);
    d.setUTCDate(d.getUTCDate() + i);
    const wd = d.getUTCDay();
    if (wd === CLOSED_WEEKDAY) continue;
    out.push({ date: kstDate(d), weekday: wd });
  }
  return out;
}

/** 특정 클래스·날짜의 회차 (이미 시작했거나 1시간 이내 회차는 제외) */
export function sessionsFor(c: ClassItem, date: string, now = new Date()): Session[] {
  return c.slots
    .map((time) => ({ id: sessionId(c.slug, date, time), classSlug: c.slug, date, time, at: kstToDate(date, time).toISOString(), capacity: c.capacity }))
    .filter((s) => new Date(s.at).getTime() - now.getTime() > 3600_000);
}

export function allSessionsOn(date: string, now = new Date()) {
  return classes.flatMap((c) => sessionsFor(c, date, now));
}

export const weekdayKo = ["일", "월", "화", "수", "목", "금", "토"];

export function fmtSession(s: { date: string; time: string }) {
  const d = new Date(`${s.date}T12:00:00+09:00`);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${weekdayKo[d.getUTCDay()]}) ${s.time}`;
}
