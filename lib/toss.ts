import "server-only";

const API = "https://api.tosspayments.com/v1";

export const tossClientKey = () => process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
const secret = () => process.env.TOSS_SECRET_KEY || "";

/** 토스 키가 모두 설정되어야 실제(테스트) 결제창을 사용 */
export const tossReady = () => Boolean(tossClientKey() && secret());
export const isTestKey = () => tossClientKey().startsWith("test_") && secret().startsWith("test_");

const auth = () => `Basic ${Buffer.from(`${secret()}:`).toString("base64")}`;

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  receipt?: { url: string } | null;
};

export class TossError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

async function call<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: auth(),
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new TossError(data.code ?? "UNKNOWN", data.message ?? "결제 처리 중 오류가 발생했습니다.");
  return data as T;
}

/** 결제 승인 */
export const confirmPayment = (p: { paymentKey: string; orderId: string; amount: number }) =>
  call<TossPayment>("/payments/confirm", p, `confirm-${p.orderId}`);

/** 결제 취소 (전액) */
export const cancelPayment = (paymentKey: string, reason: string) =>
  call<TossPayment>(`/payments/${encodeURIComponent(paymentKey)}/cancel`, { cancelReason: reason }, `cancel-${paymentKey}`);
