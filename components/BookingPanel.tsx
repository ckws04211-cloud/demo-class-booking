"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { validateBooking, type BookingErrors } from "@/lib/validate";

type Slot = { id: string; date: string; time: string; left: number };
type Props = {
  cls: { slug: string; title: string; price: number; durationMin: number };
  dates: { date: string; weekday: number }[];
  slots: Slot[];
  clientKey: string; // 비어 있으면 데모(시뮬레이션) 결제
};

const wd = ["일", "월", "화", "수", "목", "금", "토"];
const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const fmtPhone = (v: string) => {
  const d = v.replace(/[^0-9]/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
};

export default function BookingPanel({ cls, dates, slots, clientKey }: Props) {
  const router = useRouter();
  const byDate = useMemo(() => {
    const m: Record<string, Slot[]> = {};
    for (const s of slots) (m[s.date] ??= []).push(s);
    return m;
  }, [slots]);
  const firstOpen = dates.find((d) => byDate[d.date]?.some((s) => s.left > 0))?.date ?? dates[0]?.date;

  const [date, setDate] = useState(firstOpen);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: "", phone: "", email: "", agree: false });
  const [errors, setErrors] = useState<BookingErrors>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const slot = slots.find((s) => s.id === slotId) ?? null;
  const maxCount = Math.min(4, slot?.left ?? 4);
  const total = cls.price * count;

  async function pay(e: FormEvent) {
    e.preventDefault();
    if (!slot) return;
    const v = validateBooking({ sessionId: slot.id, headcount: count, ...form });
    setErrors(v);
    if (Object.keys(v).length) return;

    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: slot.id, headcount: count, ...form }),
      });
      const o = await res.json();
      if (!o.ok) {
        if (o.errors) setErrors(o.errors);
        setMsg(o.message ?? "입력 내용을 확인해 주세요.");
        if (res.status === 409) router.refresh();
        return;
      }

      if (o.demo || !clientKey) {
        const r = await fetch("/api/orders/demo-pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: o.orderId }) });
        const d = await r.json();
        if (!d.ok) throw new Error(d.message);
        router.push(`/booking/success?orderId=${o.orderId}&demo=1`);
        return;
      }

      const { loadTossPayments, ANONYMOUS } = await import("@tosspayments/tosspayments-sdk");
      const toss = await loadTossPayments(clientKey);
      const payment = toss.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: o.amount },
        orderId: o.orderId,
        orderName: o.orderName.slice(0, 100),
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        successUrl: `${window.location.origin}/booking/success`,
        failUrl: `${window.location.origin}/booking/fail`,
      });
    } catch (err) {
      // 사용자가 결제창을 닫은 경우 등
      const code = (err as { code?: string })?.code;
      setMsg(code === "USER_CANCEL" ? "결제를 취소했습니다. 10분 안에 다시 시도하면 좌석이 유지됩니다." : (err as Error)?.message || "결제 요청 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-6 shadow-sm">
      {step === 1 ? (
        <>
          <h2 className="font-bold">날짜 선택</h2>
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-2">
            {dates.map((d) => {
              const day = new Date(`${d.date}T12:00:00+09:00`);
              const soldOut = !byDate[d.date]?.some((s) => s.left > 0);
              const active = d.date === date;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={soldOut}
                  onClick={() => { setDate(d.date); setSlotId(null); }}
                  className={`flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 transition ${
                    active ? "border-clay-800 bg-clay-800 text-white" : "border-clay-100 bg-white hover:border-clay-400"
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className={`text-xs ${d.weekday === 0 ? (active ? "text-red-200" : "text-red-500") : d.weekday === 6 ? (active ? "text-blue-200" : "text-blue-600") : ""}`}>{wd[d.weekday]}</span>
                  <span className="text-lg font-bold">{day.getUTCDate()}</span>
                </button>
              );
            })}
          </div>

          <h2 className="mt-5 font-bold">시간 선택</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(byDate[date] ?? []).length === 0 && <p className="col-span-3 text-sm text-clay-400">예약 가능한 시간이 없습니다.</p>}
            {(byDate[date] ?? []).map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={s.left === 0}
                onClick={() => { setSlotId(s.id); setCount((c) => Math.min(c, s.left)); }}
                className={`rounded-xl border px-2 py-3 text-center transition ${
                  slotId === s.id ? "border-clay-800 bg-clay-800 text-white" : "border-clay-100 bg-white hover:border-clay-400"
                } disabled:cursor-not-allowed disabled:bg-clay-50 disabled:text-clay-300`}
              >
                <span className="block font-bold">{s.time}</span>
                <span className={`text-xs ${slotId === s.id ? "text-clay-200" : s.left <= 2 && s.left > 0 ? "font-bold text-red-500" : "text-clay-400"}`}>
                  {s.left === 0 ? "마감" : `${s.left}석 남음`}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-bold">인원</h2>
            <div className="flex items-center rounded-xl border border-clay-100 bg-white">
              <button type="button" aria-label="인원 줄이기" className="px-4 py-2 text-lg disabled:opacity-30" disabled={count <= 1} onClick={() => setCount((c) => c - 1)}>−</button>
              <span className="w-8 text-center font-bold">{count}</span>
              <button type="button" aria-label="인원 늘리기" className="px-4 py-2 text-lg disabled:opacity-30" disabled={count >= maxCount} onClick={() => setCount((c) => c + 1)}>+</button>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between border-t border-clay-100 pt-5">
            <span className="text-sm text-clay-500">총 결제 금액</span>
            <span className="text-2xl font-bold">{won(total)}</span>
          </div>
          <button type="button" disabled={!slot} onClick={() => setStep(2)} className="btn-primary mt-5 w-full py-4 text-base">
            {slot ? "예약 정보 입력" : "시간을 선택해 주세요"}
          </button>
        </>
      ) : (
        <form onSubmit={pay} noValidate>
          <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-clay-500 hover:text-clay-900">← 일정 다시 선택</button>
          <div className="mt-4 rounded-xl bg-clay-50 p-4 text-sm">
            <p className="font-bold">{cls.title}</p>
            <p className="mt-1 text-clay-600">
              {slot && `${new Date(`${slot.date}T12:00:00+09:00`).getUTCMonth() + 1}월 ${new Date(`${slot.date}T12:00:00+09:00`).getUTCDate()}일 (${wd[new Date(`${slot.date}T12:00:00+09:00`).getUTCDay()]}) ${slot.time}`} · {count}명
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block"><span className="label">예약자 이름</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />{errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}</label>
            <label className="block"><span className="label">휴대폰 번호</span><input className="input" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: fmtPhone(e.target.value) })} placeholder="010-0000-0000" autoComplete="tel" />{errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}</label>
            <label className="block"><span className="label">이메일</span><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" />{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}</label>
            <label className="flex items-start gap-2 text-sm text-clay-600">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-clay-800" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
              <span>예약·환불 규정(시작 24시간 전까지 전액 환불) 및 개인정보 수집·이용에 동의합니다.{errors.agree && <span className="mt-1 block text-xs text-red-600">{errors.agree}</span>}</span>
            </label>
          </div>
          {msg && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{msg}</p>}
          <button disabled={busy} className="btn-accent mt-6 w-full py-4 text-base">{busy ? "처리 중..." : `${won(total)} 결제하기`}</button>
          <p className="mt-3 text-center text-xs text-clay-400">
            {clientKey ? "토스페이먼츠 테스트 결제창으로 이동합니다 · 실제 청구 없음" : "데모 환경: 결제가 시뮬레이션으로 처리됩니다"}
          </p>
        </form>
      )}
    </div>
  );
}
