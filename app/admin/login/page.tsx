import { LoginForm } from "@/components/admin/forms";
import { adminDemo } from "@/lib/auth";

export const metadata = { title: "관리자 로그인" };

export default function AdminLogin() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="card w-full max-w-sm p-8">
        <p className="font-serif text-2xl font-bold">손결 공방 관리자</p>
        <p className="mb-6 mt-1 text-sm text-clay-500">예약·결제 관리</p>
        <LoginForm demo={adminDemo()} />
      </div>
    </div>
  );
}
