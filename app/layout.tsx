import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import TestBanner from "@/components/TestBanner";

export const metadata: Metadata = {
  title: { default: "손결 공방 | 도자기 원데이 클래스", template: "%s | 손결 공방" },
  description: "물레, 핸드빌딩, 유약 페인팅까지. 손으로 만드는 도자기 원데이 클래스를 예약하세요.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col">
        <TestBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="mt-20 border-t border-clay-100 bg-white py-10 text-sm text-clay-400">
          <div className="container-x flex flex-col justify-between gap-4 md:flex-row">
            <div>
              <p className="font-serif text-base font-bold text-clay-800">손결 공방</p>
              <p className="mt-1">서울특별시 성동구 성수이로 000, 2층 · 화–일 10:00–19:00</p>
            </div>
            <div className="md:text-right">
              <a href="/admin" className="text-xs underline-offset-2 hover:underline">관리자</a>
              <p className="mt-1 text-xs">본 사이트는 포트폴리오용 데모이며, 실제 공방이 아닙니다.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
