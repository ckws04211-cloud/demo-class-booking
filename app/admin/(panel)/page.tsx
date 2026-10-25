import Link from "next/link";
import { Badge, fmtDT } from "@/components/admin/ui";
import { getClass, won } from "@/lib/catalog";
import { listOrders, seatsUsed } from "@/lib/repo";
import { allSessionsOn, kstDate } from "@/lib/schedule";

export default async function Dashboard() {
  const orders = await listOrders();
  const paid = orders.filter((o) => o.status === "paid");
  const today = kstDate(new Date());
  const monthKey = today.slice(0, 7);
  const monthRevenue = paid.filter((o) => kstDate(new Date(o.paidAt ?? o.createdAt)).startsWith(monthKey)).reduce((s, o) => s + o.amount, 0);
  const todaySessions = allSessionsOn(today, new Date(Date.now() - 24 * 3600_000));
  const used = await seatsUsed(todaySessions.map((s) => s.id));
  const upcoming = paid.filter((o) => new Date(o.sessionAt) > new Date()).length;

  const stats = [
    ["이번 달 결제액", won(monthRevenue)],
    ["예정된 예약", `${upcoming}건`],
    ["오늘 회차", `${todaySessions.length}회`],
    ["환불", `${orders.filter((o) => o.status === "cancelled").length}건`],
  ];

  return (
    <>
      <h1 className="font-serif text-2xl font-bold">대시보드</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="card p-5">
            <p className="text-sm text-clay-400">{k}</p>
            <p className="mt-1 text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-clay-100 px-5 py-4">
            <h2 className="font-bold">최근 예약</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-clay-500 hover:text-clay-900">전체 보기</Link>
          </div>
          {orders.length === 0 && <p className="px-5 py-10 text-center text-sm text-clay-400">아직 예약이 없습니다.</p>}
          <ul className="divide-y divide-clay-50">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.orderId}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-clay-50">
                  <Badge s={o.status} />
                  <span className="flex-1 truncate text-sm font-semibold">{o.name} · {getClass(o.classSlug)?.title}</span>
                  <span className="text-sm">{won(o.amount)}</span>
                  <span className="hidden text-xs text-clay-400 sm:inline">{fmtDT(o.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="card overflow-hidden">
          <div className="border-b border-clay-100 px-5 py-4"><h2 className="font-bold">오늘 회차</h2></div>
          {todaySessions.length === 0 && <p className="px-5 py-10 text-center text-sm text-clay-400">오늘은 휴무이거나 남은 회차가 없습니다.</p>}
          <ul className="divide-y divide-clay-50">
            {todaySessions.map((s) => {
              const u = used[s.id] ?? 0;
              return (
                <li key={s.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{s.time} · {getClass(s.classSlug)?.title}</span>
                    <span className="text-clay-500">{u}/{s.capacity}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-clay-100"><div className="h-full bg-clay-500" style={{ width: `${(u / s.capacity) * 100}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
