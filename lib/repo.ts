import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HOLD_MINUTES } from "./schedule";
import type { Order, OrderStatus } from "./types";

/**
 * 주문 저장소
 * - SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 있으면 Supabase (좌석 홀드는 DB 함수에서 잠금 처리)
 * - 없으면 메모리 데모 저장소 (서버 재시작 시 초기화)
 */

type G = { __scMem?: Order[]; __scSb?: SupabaseClient; __scLock?: Promise<unknown> };
const g = globalThis as unknown as G;
const mem = () => (g.__scMem ??= []);
export const hasSupabase = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sb(): Promise<SupabaseClient | null> {
  if (!hasSupabase()) return null;
  if (!g.__scSb) {
    const { createClient } = await import("@supabase/supabase-js");
    g.__scSb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  }
  return g.__scSb;
}

const toOrder = (r: Record<string, unknown>): Order => ({
  id: r.id as string,
  orderId: r.order_id as string,
  code: r.code as string,
  classSlug: r.class_slug as string,
  sessionId: r.session_id as string,
  sessionAt: r.session_at as string,
  headcount: r.headcount as number,
  amount: r.amount as number,
  name: r.name as string,
  phone: r.phone as string,
  email: r.email as string,
  status: r.status as OrderStatus,
  paymentKey: (r.payment_key as string) ?? null,
  method: (r.method as string) ?? null,
  receiptUrl: (r.receipt_url as string) ?? null,
  cancelReason: (r.cancel_reason as string) ?? null,
  createdAt: r.created_at as string,
  paidAt: (r.paid_at as string) ?? null,
  cancelledAt: (r.cancelled_at as string) ?? null,
});

const holdAlive = (o: Order) => o.status === "pending" && Date.now() - new Date(o.createdAt).getTime() < HOLD_MINUTES * 60_000;
const occupies = (o: Order) => o.status === "paid" || holdAlive(o);

/** 회차별 사용 중 좌석 수 (결제 완료 + 결제 대기 중 홀드) */
export async function seatsUsed(sessionIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = Object.fromEntries(sessionIds.map((id) => [id, 0]));
  if (!sessionIds.length) return out;
  const c = await sb();
  let rows: Order[];
  if (c) {
    const { data, error } = await c.from("orders").select("*").in("session_id", sessionIds).in("status", ["paid", "pending"]);
    if (error) throw new Error(error.message);
    rows = (data ?? []).map(toOrder);
  } else {
    rows = mem().filter((o) => sessionIds.includes(o.sessionId));
  }
  for (const o of rows) if (occupies(o)) out[o.sessionId] += o.headcount;
  return out;
}

export class SoldOutError extends Error {}

type NewOrder = Pick<Order, "orderId" | "code" | "classSlug" | "sessionId" | "sessionAt" | "headcount" | "amount" | "name" | "phone" | "email">;

/** 정원 확인 후 결제 대기 주문 생성 (동시 예약 시 초과 방지) */
export async function createPendingOrder(o: NewOrder, capacity: number): Promise<Order> {
  const c = await sb();
  if (c) {
    const { data, error } = await c.rpc("create_pending_order", {
      p_order_id: o.orderId, p_code: o.code, p_class_slug: o.classSlug, p_session_id: o.sessionId, p_session_at: o.sessionAt,
      p_headcount: o.headcount, p_amount: o.amount, p_name: o.name, p_phone: o.phone, p_email: o.email,
      p_capacity: capacity, p_hold_minutes: HOLD_MINUTES,
    });
    if (error) {
      if (error.message.includes("SOLD_OUT")) throw new SoldOutError();
      throw new Error(error.message);
    }
    return toOrder(data as Record<string, unknown>);
  }
  // 메모리: 직렬화로 동시 요청 시 초과 예약 방지
  const run = async () => {
    const used = mem().filter((x) => x.sessionId === o.sessionId && occupies(x)).reduce((s, x) => s + x.headcount, 0);
    if (used + o.headcount > capacity) throw new SoldOutError();
    const order: Order = { ...o, id: crypto.randomUUID(), status: "pending", paymentKey: null, method: null, receiptUrl: null, cancelReason: null, createdAt: new Date().toISOString(), paidAt: null, cancelledAt: null };
    mem().push(order);
    return order;
  };
  const p = (g.__scLock ?? Promise.resolve()).then(run, run);
  g.__scLock = p.catch(() => undefined);
  return p;
}

export async function getOrderByOrderId(orderId: string): Promise<Order | null> {
  const c = await sb();
  if (c) {
    const { data } = await c.from("orders").select("*").eq("order_id", orderId).maybeSingle();
    return data ? toOrder(data) : null;
  }
  return mem().find((o) => o.orderId === orderId) ?? null;
}

export async function findByCode(code: string, phone: string): Promise<Order | null> {
  const c = await sb();
  if (c) {
    const { data } = await c.from("orders").select("*").eq("code", code).eq("phone", phone).maybeSingle();
    return data ? toOrder(data) : null;
  }
  return mem().find((o) => o.code === code && o.phone === phone) ?? null;
}

/** 상태 전이: from 상태일 때만 변경 (중복 승인·중복 취소 방지) */
export async function transition(orderId: string, from: OrderStatus, patch: Partial<Order> & { status: OrderStatus }): Promise<Order | null> {
  const c = await sb();
  if (c) {
    const row: Record<string, unknown> = { status: patch.status };
    if (patch.paymentKey !== undefined) row.payment_key = patch.paymentKey;
    if (patch.method !== undefined) row.method = patch.method;
    if (patch.receiptUrl !== undefined) row.receipt_url = patch.receiptUrl;
    if (patch.cancelReason !== undefined) row.cancel_reason = patch.cancelReason;
    if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
    if (patch.cancelledAt !== undefined) row.cancelled_at = patch.cancelledAt;
    const { data, error } = await c.from("orders").update(row).eq("order_id", orderId).eq("status", from).select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toOrder(data) : null;
  }
  const o = mem().find((x) => x.orderId === orderId && x.status === from);
  if (!o) return null;
  Object.assign(o, patch);
  return o;
}

export async function listOrders(opts: { status?: OrderStatus; q?: string } = {}): Promise<Order[]> {
  const c = await sb();
  let rows: Order[];
  if (c) {
    let q = c.from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    if (opts.status) q = q.eq("status", opts.status);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    rows = (data ?? []).map(toOrder);
  } else {
    rows = [...mem()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).filter((o) => !opts.status || o.status === opts.status);
  }
  // 홀드 시간이 지난 결제 대기 주문은 '만료'로 표시
  rows = rows.map((o) => (o.status === "pending" && !holdAlive(o) ? { ...o, status: "expired" as const } : o));
  if (opts.status === "pending") rows = rows.filter((o) => o.status === "pending");
  const kw = opts.q?.trim().toLowerCase();
  return kw ? rows.filter((o) => [o.name, o.phone, o.code, o.orderId, o.email].some((v) => v.toLowerCase().includes(kw))) : rows;
}

export { holdAlive };
