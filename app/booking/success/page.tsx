import Link from "next/link";
import Receipt from "@/components/Receipt";
import { getOrderByOrderId, holdAlive, transition } from "@/lib/repo";
import { confirmPayment, TossError } from "@/lib/toss";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "예약 완료" };

type SP = { paymentKey?: string; orderId?: string; amount?: string; demo?: string };

async function settle(sp: SP): Promise<{ order: Order | null; error?: string }> {
  if (!sp.orderId) return { order: null, error: "주문 정보가 없습니다." };
  const order = await getOrderByOrderId(sp.orderId);
  if (!order) return { order: null, error: "존재하지 않는 주문입니다." };

  // 새로고침 등으로 다시 들어온 경우: 이미 처리된 결과를 그대로 보여줌
  if (order.status !== "pending") return { order };
  if (!sp.paymentKey) return { order, error: "결제 정보가 올바르지 않습니다." };

  // 1) 금액 검증: 서버에 저장된 주문 금액과 결제 요청 금액이 같아야 함
  if (Number(sp.amount) !== order.amount) {
    const failed = await transition(order.orderId, "pending", { status: "failed", cancelReason: "금액 불일치" });
    return { order: failed ?? order, error: "결제 금액이 주문 금액과 일치하지 않아 결제를 진행하지 않았습니다." };
  }
  // 2) 좌석 홀드 시간 확인
  if (!holdAlive(order)) {
    const expired = await transition(order.orderId, "pending", { status: "expired" });
    return { order: expired ?? order, error: "결제 가능 시간(10분)이 지나 결제를 진행하지 않았습니다. 다시 예약해 주세요." };
  }
  // 3) 토스 결제 승인 API 호출
  try {
    const p = await confirmPayment({ paymentKey: sp.paymentKey, orderId: order.orderId, amount: order.amount });
    const paid = await transition(order.orderId, "pending", {
      status: "paid",
      paymentKey: p.paymentKey,
      method: p.method,
      receiptUrl: p.receipt?.url ?? null,
      paidAt: new Date().toISOString(),
    });
    return { order: paid ?? (await getOrderByOrderId(order.orderId)) };
  } catch (e) {
    const msg = e instanceof TossError ? e.message : "결제 승인 중 오류가 발생했습니다.";
    if (e instanceof TossError && e.code === "ALREADY_PROCESSED_PAYMENT") {
      return { order: await getOrderByOrderId(order.orderId) };
    }
    const failed = await transition(order.orderId, "pending", { status: "failed", cancelReason: msg });
    return { order: failed ?? order, error: msg };
  }
}

export default async function Success({ searchParams }: { searchParams: Promise<SP> }) {
  const { order, error } = await settle(await searchParams);
  const ok = order?.status === "paid";

  return (
    <div className="container-x max-w-xl py-14">
      <div className="text-center">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${ok ? "bg-moss-500" : "bg-red-500"} text-white`}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">{ok ? <path d="M5 12l5 5L20 7" /> : <path d="M6 6l12 12M18 6L6 18" />}</svg>
        </div>
        <h1 className="mt-6 font-serif text-3xl font-bold">{ok ? "예약이 확정되었습니다" : "예약을 완료하지 못했습니다"}</h1>
        <p className="mt-2 text-clay-500">{ok ? "예약 코드는 예약 조회·취소 시 필요합니다. 꼭 저장해 두세요." : error}</p>
      </div>
      {order && <div className="mt-8"><Receipt o={order} /></div>}
      <div className="mt-8 grid grid-cols-2 gap-3">
        <Link href="/" className="btn-ghost">홈으로</Link>
        <Link href="/booking/lookup" className="btn-primary">예약 조회</Link>
      </div>
    </div>
  );
}
