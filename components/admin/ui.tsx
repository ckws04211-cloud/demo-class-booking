import type { OrderStatus } from "@/lib/types";

export const statusMeta: Record<OrderStatus, { label: string; cls: string }> = {
  paid: { label: "결제 완료", cls: "bg-moss-500/15 text-moss-600" },
  pending: { label: "결제 대기", cls: "bg-amber-100 text-amber-800" },
  cancelled: { label: "환불 완료", cls: "bg-clay-100 text-clay-500" },
  expired: { label: "만료", cls: "bg-clay-100 text-clay-400" },
  failed: { label: "실패", cls: "bg-red-100 text-red-700" },
};

export const Badge = ({ s }: { s: OrderStatus }) => <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${statusMeta[s].cls}`}>{statusMeta[s].label}</span>;

export const fmtDT = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(new Date(iso));
