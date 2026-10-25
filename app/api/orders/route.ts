import { NextResponse } from "next/server";
import { getClass } from "@/lib/catalog";
import { newCode, newOrderId, normPhone } from "@/lib/ids";
import { createPendingOrder, SoldOutError } from "@/lib/repo";
import { fmtSession, parseSessionId } from "@/lib/schedule";
import { tossReady } from "@/lib/toss";
import { validateBooking, type BookingInput } from "@/lib/validate";

const hits = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const recent = (hits.get(ip) ?? []).filter((t) => Date.now() - t < 60_000);
  recent.push(Date.now());
  hits.set(ip, recent);
  if (recent.length > 10) return NextResponse.json({ ok: false, message: "잠시 후 다시 시도해 주세요." }, { status: 429 });

  let body: Partial<BookingInput>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  }

  const errors = validateBooking(body);
  if (Object.keys(errors).length) return NextResponse.json({ ok: false, errors }, { status: 422 });

  const session = parseSessionId(String(body.sessionId ?? ""));
  if (!session) return NextResponse.json({ ok: false, message: "존재하지 않는 회차입니다." }, { status: 400 });
  if (new Date(session.at).getTime() - Date.now() < 3600_000) {
    return NextResponse.json({ ok: false, message: "시작 1시간 전까지만 예약할 수 있습니다." }, { status: 400 });
  }
  const cls = getClass(session.classSlug)!;

  // 결제 금액은 반드시 서버에서 계산 (클라이언트가 보낸 금액은 신뢰하지 않음)
  const amount = cls.price * body.headcount!;

  try {
    const order = await createPendingOrder(
      {
        orderId: newOrderId(session.date),
        code: newCode(),
        classSlug: cls.slug,
        sessionId: session.id,
        sessionAt: session.at,
        headcount: body.headcount!,
        amount,
        name: body.name!.trim().slice(0, 30),
        phone: normPhone(body.phone!),
        email: body.email!.trim().slice(0, 120),
      },
      cls.capacity,
    );
    return NextResponse.json({
      ok: true,
      orderId: order.orderId,
      amount: order.amount,
      orderName: `${cls.title} ${fmtSession(session)} ${order.headcount}명`,
      customerName: order.name,
      customerEmail: order.email,
      demo: !tossReady(),
    });
  } catch (e) {
    if (e instanceof SoldOutError) return NextResponse.json({ ok: false, message: "선택하신 회차의 잔여석이 부족합니다. 다른 시간을 선택해 주세요." }, { status: 409 });
    console.error(e);
    return NextResponse.json({ ok: false, message: "예약 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
