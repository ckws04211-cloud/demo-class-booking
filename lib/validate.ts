export type BookingInput = { sessionId: string; headcount: number; name: string; phone: string; email: string; agree: boolean };
export type BookingErrors = Partial<Record<"name" | "phone" | "email" | "agree" | "headcount", string>>;

export function validateBooking(b: Partial<BookingInput>): BookingErrors {
  const e: BookingErrors = {};
  if (!b.name || b.name.trim().length < 2) e.name = "이름을 2자 이상 입력해 주세요.";
  const phone = (b.phone ?? "").replace(/[^0-9]/g, "");
  if (!/^01\d{8,9}$/.test(phone)) e.phone = "휴대폰 번호를 정확히 입력해 주세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email?.trim() ?? "")) e.email = "이메일 주소를 정확히 입력해 주세요.";
  if (!Number.isInteger(b.headcount) || b.headcount! < 1 || b.headcount! > 4) e.headcount = "인원은 1~4명까지 선택할 수 있습니다.";
  if (!b.agree) e.agree = "예약·환불 규정에 동의해 주세요.";
  return e;
}
