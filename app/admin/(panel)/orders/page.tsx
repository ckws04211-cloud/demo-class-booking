import Link from "next/link";
import { Badge, fmtDT, statusMeta } from "@/components/admin/ui";
import { getClass, won } from "@/lib/catalog";
import { listOrders } from "@/lib/repo";
import { fmtSession, parseSessionId } from "@/lib/schedule";
import type { OrderStatus } from "@/lib/types";

const tabs: (OrderStatus | "all")[] = ["all", "paid", "pending", "cancelled", "failed", "expired"];

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const sp = await searchParams;
  const status = tabs.includes(sp.status as OrderStatus) && sp.status !== "all" ? (sp.status as OrderStatus) : undefined;
  const all = await listOrders({ q: sp.q });
  const rows = status ? all.filter((o) => o.status === status) : all;

  return (
    <>
      <h1 className="font-serif text-2xl font-bold">예약·결제</h1>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <Link key={t} href={`/admin/orders${t === "all" ? "" : `?status=${t}`}`} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${(status ?? "all") === t ? "bg-clay-800 text-white" : "bg-white text-clay-500 hover:text-clay-900"}`}>
              {t === "all" ? "전체" : statusMeta[t].label} <span className="opacity-60">{t === "all" ? all.length : all.filter((o) => o.status === t).length}</span>
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={sp.q} className="input w-56 py-2" placeholder="이름, 번호, 예약코드" />
          <button className="btn-primary py-2">검색</button>
        </form>
      </div>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-clay-50 text-left text-xs text-clay-400">
            <tr><th className="px-4 py-3">상태</th><th className="px-4 py-3">예약자</th><th className="px-4 py-3">클래스 / 일시</th><th className="px-4 py-3 text-right">인원</th><th className="px-4 py-3 text-right">금액</th><th className="px-4 py-3 text-right">접수</th></tr>
          </thead>
          <tbody className="divide-y divide-clay-50">
            {rows.length === 0 && <tr><td colSpan={6} className="py-14 text-center text-clay-400">예약이 없습니다.</td></tr>}
            {rows.map((o) => {
              const s = parseSessionId(o.sessionId);
              return (
                <tr key={o.id} className="hover:bg-clay-50">
                  <td className="px-4 py-3"><Badge s={o.status} /></td>
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.orderId}`} className="font-semibold hover:underline">{o.name}</Link><p className="font-mono text-xs text-clay-400">{o.code}</p></td>
                  <td className="px-4 py-3">{getClass(o.classSlug)?.title}<p className="text-xs text-clay-400">{s ? fmtSession(s) : ""}</p></td>
                  <td className="px-4 py-3 text-right">{o.headcount}명</td>
                  <td className="px-4 py-3 text-right font-semibold">{won(o.amount)}</td>
                  <td className="px-4 py-3 text-right text-xs text-clay-400">{fmtDT(o.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
