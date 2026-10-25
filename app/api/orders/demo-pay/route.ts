import { NextResponse } from "next/server";
import { getOrderByOrderId, holdAlive, transition } from "@/lib/repo";
import { tossReady } from "@/lib/toss";

/** 토스 키가 설정되지 않은 데모 환경에서만 사용하는 결제 시뮬레이션 */
export async function POST(req: Request) {
  if (tossReady()) return NextResponse.json({ ok: false, message: "실제 결제 환경에서는 사용할 수 없습니다." }, { status: 403 });
  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string };
  const o = orderId ? await getOrderByOrderId(orderId) : null;
  if (!o || !holdAlive(o)) return NextResponse.json({ ok: false, message: "결제 가능 시간이 지났습니다." }, { status: 400 });
  await transition(o.orderId, "pending", { status: "paid", method: "DEMO", paymentKey: `demo_${o.orderId}`, paidAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
