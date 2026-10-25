export type OrderStatus = "pending" | "paid" | "cancelled" | "expired" | "failed";

export type Order = {
  id: string;
  orderId: string; // 토스 orderId
  code: string; // 예약 조회 코드
  classSlug: string;
  sessionId: string;
  sessionAt: string;
  headcount: number;
  amount: number;
  name: string;
  phone: string;
  email: string;
  status: OrderStatus;
  paymentKey: string | null;
  method: string | null;
  receiptUrl: string | null;
  cancelReason: string | null;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
};
