import "server-only";

const API = "https://api.tosspayments.com/v1";

// 키 형식 검증: 클라이언트 자리에 시크릿 키가 들어가면 브라우저로 노출되므로 절대 사용하지 않음
const CLIENT_RE = /^(test|live)_ck_/;
const SECRET_RE = /^(test|live)_sk_/;
const rawClient = () => (process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "").trim();
const rawSecret = () => (process.env.TOSS_SECRET_KEY || "").trim();

export const tossClientKey = () => (CLIENT_RE.test(rawClient()) ? rawClient() : "");
const secret = () => (SECRET_RE.test(rawSecret()) ? rawSecret() : "");

/** 설정 오류 안내용 (값 자체는 노출하지 않음) */
export function tossKeyProblem(): string | null {
  const c = rawClient();
  const s = rawSecret();
  if (!c && !s) return null;
  if (/_g?sk_/.test(c)) return "NEXT_PUBLIC_TOSS_CLIENT_KEY에 시크릿 키가 들어가 있습니다. 클라이언트 키(test_ck_...)로 바꾸고, 노출된 시크릿 키는 재발급하세요.";
  if (/_gck_/.test(c) || /_gsk_/.test(s)) return "결제위젯 키(gck/gsk)가 아닌 API 개별 연동 키(test_ck_ / test_sk_)를 사용하세요.";
  if (!CLIENT_RE.test(c)) return "NEXT_PUBLIC_TOSS_CLIENT_KEY 형식이 올바르지 않습니다 (test_ck_...).";
  if (!SECRET_RE.test(s)) return "TOSS_SECRET_KEY 형식이 올바르지 않습니다 (test_sk_...).";
  return null;
}

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
