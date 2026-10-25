import Link from "next/link";
import { notFound } from "next/navigation";
import { RefundForm } from "@/components/admin/forms";
import { fmtDT } from "@/components/admin/ui";
import Receipt from "@/components/Receipt";
import { getOrderByOrderId, holdAlive } from "@/lib/repo";

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ refunded?: string }> }) {
  const { refunded } = await searchParams;
  const raw = await getOrderByOrderId((await params).orderId);
  if (!raw) notFound();
  const o = raw.status === "pending" && !holdAlive(raw) ? { ...raw, status: "expired" as const } : raw;

  const timeline = [
    ["접수", o.createdAt],
    ["결제 완료", o.paidAt],
    ["취소·환불", o.cancelledAt],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
      <Link href="/admin/orders" className="text-sm font-semibold text-clay-500 hover:text-clay-900">← 목록</Link>
      {refunded && <p className="mt-4 rounded-xl bg-moss-500/10 p-4 text-sm font-semibold text-moss-600">결제가 취소되고 전액 환불되었습니다.</p>}
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Receipt o={o} />
        <div className="space-y-4">
          <div className="card p-5 text-sm">
            <h2 className="font-bold">결제 정보</h2>
            <dl className="mt-3 space-y-2">
              <div className="flex justify-between gap-3"><dt className="text-clay-400">주문번호</dt><dd className="break-all text-right font-mono text-xs">{o.orderId}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-clay-400">paymentKey</dt><dd className="break-all text-right font-mono text-xs">{o.paymentKey ?? "-"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-clay-400">이메일</dt><dd>{o.email}</dd></div>
              {o.cancelReason && <div className="flex justify-between gap-3"><dt className="text-clay-400">사유</dt><dd>{o.cancelReason}</dd></div>}
            </dl>
            <h3 className="mt-5 font-bold">처리 이력</h3>
            <ol className="mt-2 space-y-1.5 border-l-2 border-clay-100 pl-4">
              {timeline.map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><span className="text-clay-400">{fmtDT(v)}</span></li>)}
            </ol>
          </div>
          {o.status === "paid" && <div className="card p-5"><RefundForm orderId={o.orderId} /></div>}
        </div>
      </div>
    </>
  );
}
