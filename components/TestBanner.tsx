import { tossReady } from "@/lib/toss";

export default function TestBanner() {
  return (
    <div className="bg-clay-800 px-4 py-2 text-center text-xs font-semibold text-clay-100">
      {tossReady()
        ? "테스트 결제 환경입니다 · 실제로 청구되지 않습니다"
        : "데모 환경입니다 · 결제는 시뮬레이션으로 처리되며 실제로 청구되지 않습니다"}
    </div>
  );
}
