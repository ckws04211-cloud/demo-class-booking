"use client";

import { useActionState } from "react";
import { loginAction, refundAction } from "@/app/admin/actions";

export function LoginForm({ demo }: { demo: boolean }) {
  const [s, action, pending] = useActionState(loginAction, {} as { error?: string });
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="label">관리자 비밀번호</span>
        <input name="password" type="password" className="input" defaultValue={demo ? "demo1234" : ""} autoFocus />
      </label>
      {s.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{s.error}</p>}
      <button disabled={pending} className="btn-primary w-full py-3.5">{pending ? "확인 중..." : "로그인"}</button>
      {demo && <p className="rounded-xl bg-clay-50 p-3 text-center text-xs text-clay-500">데모 비밀번호: <b>demo1234</b></p>}
    </form>
  );
}

export function RefundForm({ orderId }: { orderId: string }) {
  const [s, action, pending] = useActionState(refundAction, {} as { error?: string; ok?: boolean });
  if (s.ok) return <p className="rounded-xl bg-moss-500/10 p-4 text-sm font-semibold text-moss-600">환불이 완료되었습니다.</p>;
  return (
    <details>
      <summary className="btn w-full cursor-pointer list-none border border-red-200 bg-white text-red-600 hover:bg-red-50">결제 취소·환불</summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <input name="reason" className="input" placeholder="환불 사유 (예: 공방 사정으로 취소)" />
        {s.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{s.error}</p>}
        <button disabled={pending} className="btn w-full bg-red-600 text-white hover:bg-red-700">{pending ? "처리 중..." : "전액 환불 확정"}</button>
      </form>
    </details>
  );
}
