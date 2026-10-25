// Edge(middleware)와 Node 양쪽에서 동작하도록 Web Crypto 사용
export const SESSION_COOKIE = "sc_admin";
export const PENDING_COOKIE = "sc_pending"; // 비밀번호 통과, OTP 대기
const enc = new TextEncoder();

const secret = () => process.env.SESSION_SECRET || "demo-only-secret-change-me-in-production-32b";

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function key() {
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export type SessionPayload = { sub: string; stage: "pending" | "full"; exp: number };

export async function signSession(p: SessionPayload): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(p)));
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined, stage: SessionPayload["stage"]): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload;
    if (p.stage !== stage || p.exp < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}
