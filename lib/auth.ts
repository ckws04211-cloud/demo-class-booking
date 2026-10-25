import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, signSession, verifySession } from "./session";

export const adminPassword = () => process.env.ADMIN_PASSWORD || "demo1234";
export const adminDemo = () => process.env.ADMIN_DEMO_MODE !== "false";

export async function setAdminSession() {
  const ttl = 8 * 3600_000;
  (await cookies()).set(SESSION_COOKIE, await signSession({ sub: "admin", stage: "full", exp: Date.now() + ttl }), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: ttl / 1000,
  });
}

export async function requireAdmin() {
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value, "full");
  if (!s) redirect("/admin/login");
  return s;
}

export async function clearAdminSession() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/admin" });
}
