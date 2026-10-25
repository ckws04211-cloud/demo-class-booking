import { randomBytes } from "node:crypto";

// 토스 orderId 규칙: 6~64자, 영문 대소문자·숫자·-·_
export function newOrderId(date: string) {
  return `SG-${date.replace(/-/g, "")}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

// 예약 조회 코드: 헷갈리는 문자(0,O,1,I) 제외 6자리
const ALPHA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newCode() {
  const b = randomBytes(6);
  return Array.from(b, (x) => ALPHA[x % ALPHA.length]).join("");
}

export const normPhone = (s: string) => s.replace(/[^0-9]/g, "");
