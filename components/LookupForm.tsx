"use client";

import { useActionState } from "react";
import { cancelAction, lookupAction, type LookupState } from "@/app/booking/actions";
import Receipt from "./Receipt";

export default function LookupForm() {
  const [found, lookup, finding] = useActionState(lookupAction, {} as LookupState);
  const [cancelled, cancel, cancelling] = useActionState(cancelAction, {} as LookupState);
  const state = cancelled.order || cancelled.error ? { ...found, ...cancelled } : found;

  return (
    <>
      <form action={lookup} className="card space-y-4 p-6">
        <label className="block"><span className="label">예약 코드</span><input name="code" defaultValue={found.code} className="input font-mono uppercase tracking-widest" placeholder="예: K7M2QX" maxLength={6} /></label>
        <label className="block"><span className="label">예약자 휴대폰 번호</span><input name="phone" defaultValue={found.phone} className="input" inputMode="tel" placeholder="010-0000-0000" /></label>
        <button disabled={finding} className="btn-primary w-full py-3.5">{finding ? "조회 중..." : "예약 조회"}</button>
      </form>

      {state.error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{state.error}</p>}
      {state.notice && <p className="mt-5 rounded-xl bg-moss-500/10 p-4 text-sm font-semibold text-moss-600">{state.notice}</p>}

      {state.order && (
        <div className="mt-6">
          <Receipt o={state.order} />
          {state.order.status === "paid" && (
            <details className="mt-4">
              <summary className="btn-ghost w-full cursor-pointer list-none">예약 취소하기</summary>
              <form action={cancel} className="card mt-3 p-5">
                <input type="hidden" name="code" value={state.order.code} />
                <input type="hidden" name="phone" value={state.order.phone} />
                <p className="text-sm text-clay-600">예약을 취소하면 결제 금액 전액이 환불됩니다. 취소 후에는 되돌릴 수 없습니다.</p>
                <button disabled={cancelling} className="btn mt-4 w-full bg-red-600 text-white hover:bg-red-700">{cancelling ? "취소 처리 중..." : "취소 및 환불 확정"}</button>
              </form>
            </details>
          )}
        </div>
      )}
    </>
  );
}
