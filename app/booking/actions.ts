"use server";

import { normPhone } from "@/lib/ids";
import { findByCode, transition } from "@/lib/repo";
import { CANCEL_DEADLINE_HOURS } from "@/lib/schedule";
import { cancelPayment, TossError } from "@/lib/toss";
import type { Order } from "@/lib/types";

export type LookupState = { order?: Order; error?: string; notice?: string; code?: string; phone?: string };

export async function lookupAction(_: LookupState, fd: FormData): Promise<LookupState> {
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  const phone = normPhone(String(fd.get("phone") ?? ""));
  if (!code || !phone) return { error: "예약 코드와 휴대폰 번호를 입력해 주세요.", code, phone };
  const order = await findByCode(code, phone);
  if (!order) return { error: "일치하는 예약이 없습니다. 예약 코드와 번호를 확인해 주세요.", code, phone };
  return { order, code, phone };
}

export async function cancelAction(_: LookupState, fd: FormData): Promise<LookupState> {
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  const phone = normPhone(String(fd.get("phone") ?? ""));
  const order = await findByCode(code, phone); // 코드 + 번호로 본인 확인
  if (!order) return { error: "예약을 찾을 수 없습니다." };
  if (order.status !== "paid") return { order, code, phone, error: "취소할 수 없는 상태의 예약입니다." };
  if (new Date(order.sessionAt).getTime() - Date.now() < CANCEL_DEADLINE_HOURS * 3600_000) {
    return { order, code, phone, error: `클래스 시작 ${CANCEL_DEADLINE_HOURS}시간 전부터는 취소할 수 없습니다.` };
  }
  try {
    if (order.method !== "DEMO" && order.paymentKey) await cancelPayment(order.paymentKey, "고객 요청 취소");
  } catch (e) {
    return { order, code, phone, error: e instanceof TossError ? e.message : "환불 처리 중 오류가 발생했습니다." };
  }
  const cancelled = await transition(order.orderId, "paid", { status: "cancelled", cancelReason: "고객 요청 취소", cancelledAt: new Date().toISOString() });
  return { order: cancelled ?? order, code, phone, notice: "예약이 취소되었고 결제 금액이 전액 환불 처리되었습니다." };
}
