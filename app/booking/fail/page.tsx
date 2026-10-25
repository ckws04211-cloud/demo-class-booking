import Link from "next/link";
import { transition } from "@/lib/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "결제 실패" };

export default async function Fail({ searchParams }: { searchParams: Promise<{ code?: string; message?: string; orderId?: string }> }) {
  const { code, message, orderId } = await searchParams;
  // 사용자가 결제창을 닫은 경우(PAY_PROCESS_CANCELED)는 좌석 홀드를 유지해 재시도 가능하게 둠
  if (orderId && code !== "PAY_PROCESS_CANCELED") {
    await transition(orderId, "pending", { status: "failed", cancelReason: `${code ?? ""} ${message ?? ""}`.trim() });
  }
  const canceled = code === "PAY_PROCESS_CANCELED";

  return (
    <div className="container-x max-w-xl py-20 text-center">
      <h1 className="font-serif text-3xl font-bold">{canceled ? "결제를 취소했습니다" : "결제에 실패했습니다"}</h1>
      <p className="mt-3 text-clay-500">{canceled ? "결제가 진행되지 않았습니다. 다시 시도해 주세요." : message ?? "알 수 없는 오류가 발생했습니다."}</p>
      {code && !canceled && <p className="mt-2 font-mono text-xs text-clay-400">{code}</p>}
      <Link href="/#classes" className="btn-primary mt-10">클래스 다시 선택하기</Link>
    </div>
  );
}
