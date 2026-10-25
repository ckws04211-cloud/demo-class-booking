import { getClass, won } from "@/lib/catalog";
import { fmtSession, parseSessionId } from "@/lib/schedule";
import type { Order } from "@/lib/types";

const statusText: Record<Order["status"], [string, string]> = {
  paid: ["예약 확정", "bg-moss-500 text-white"],
  pending: ["결제 대기", "bg-amber-100 text-amber-800"],
  cancelled: ["취소·환불 완료", "bg-clay-100 text-clay-600"],
  expired: ["결제 시간 만료", "bg-clay-100 text-clay-600"],
  failed: ["결제 실패", "bg-red-100 text-red-700"],
};

export default function Receipt({ o }: { o: Order }) {
  const c = getClass(o.classSlug);
  const s = parseSessionId(o.sessionId);
  const [label, cls] = statusText[o.status];
  const rows = [
    ["예약 코드", <span key="c" className="font-mono text-lg font-bold tracking-widest">{o.code}</span>],
    ["클래스", c?.title ?? o.classSlug],
    ["일시", s ? fmtSession(s) : o.sessionAt],
    ["인원", `${o.headcount}명`],
    ["결제 금액", won(o.amount)],
    ["결제 수단", o.method === "DEMO" ? "데모 결제(시뮬레이션)" : o.method ?? "-"],
    ["예약자", `${o.name} · ${o.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}`],
  ] as const;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-clay-100 px-6 py-4">
        <span className="font-bold">예약 정보</span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{label}</span>
      </div>
      <dl className="divide-y divide-clay-50 px-6">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 py-3.5 text-sm">
            <dt className="text-clay-400">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {o.receiptUrl && (
        <div className="border-t border-clay-100 px-6 py-4 text-right">
          <a href={o.receiptUrl} target="_blank" rel="noopener" className="text-sm font-semibold text-clay-600 underline">카드 영수증 보기</a>
        </div>
      )}
    </div>
  );
}
