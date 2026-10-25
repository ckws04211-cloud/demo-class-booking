"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { adminPassword, clearAdminSession, requireAdmin, setAdminSession } from "@/lib/auth";
import { getOrderByOrderId, transition } from "@/lib/repo";
import { cancelPayment, TossError } from "@/lib/toss";

const tries = new Map<string, number[]>();

export async function loginAction(_: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const key = "admin";
  const list = (tries.get(key) ?? []).filter((t) => Date.now() - t < 10 * 60_000);
  list.push(Date.now());
  tries.set(key, list);
  if (list.length > 10) return { error: "시도가 너무 많습니다. 10분 후 다시 시도해 주세요." };
  const a = Buffer.from(String(fd.get("password") ?? ""));
  const b = Buffer.from(adminPassword());
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: "비밀번호가 올바르지 않습니다." };
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function refundAction(_: { error?: string; ok?: boolean }, fd: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const orderId = String(fd.get("orderId") ?? "");
  const reason = String(fd.get("reason") ?? "").trim() || "관리자 환불";
  const o = await getOrderByOrderId(orderId);
  if (!o || o.status !== "paid") return { error: "환불할 수 없는 상태의 예약입니다." };
  try {
    if (o.method !== "DEMO" && o.paymentKey) await cancelPayment(o.paymentKey, reason.slice(0, 200));
  } catch (e) {
    return { error: e instanceof TossError ? `${e.message} (${e.code})` : "환불 처리 중 오류가 발생했습니다." };
  }
  await transition(o.orderId, "paid", { status: "cancelled", cancelReason: reason, cancelledAt: new Date().toISOString() });
  revalidatePath("/admin", "layout");
  redirect(`/admin/orders/${o.orderId}?refunded=1`);
}
