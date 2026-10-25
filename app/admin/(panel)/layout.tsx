import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { hasSupabase } from "@/lib/repo";
import { tossReady } from "@/lib/toss";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "예약·결제" },
  { href: "/admin/schedule", label: "회차 현황" },
];

export default async function Panel({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-xl border border-clay-100 bg-white p-1">
          {nav.map((n) => <Link key={n.href} href={n.href} className="rounded-lg px-4 py-2 text-sm font-semibold text-clay-600 hover:bg-clay-50 hover:text-clay-900">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-bold ${tossReady() ? "bg-moss-500/15 text-moss-600" : "bg-amber-100 text-amber-800"}`}>{tossReady() ? "토스 테스트 결제 연결됨" : "결제 시뮬레이션 모드"}</span>
          <span className="rounded-full bg-clay-100 px-2.5 py-1 font-bold text-clay-600">{hasSupabase() ? "DB: Supabase" : "DB: 데모 메모리"}</span>
          <form action={logoutAction}><button className="rounded-lg px-3 py-1.5 font-semibold text-clay-500 hover:text-clay-900">로그아웃</button></form>
        </div>
      </div>
      {children}
    </div>
  );
}
