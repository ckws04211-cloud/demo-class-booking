import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-clay-100 bg-clay-50/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-xl font-bold text-clay-900">손결 공방</Link>
        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-4">
          <Link href="/#classes" className="rounded-lg px-3 py-2 text-clay-600 hover:text-clay-900">클래스</Link>
          <Link href="/booking/lookup" className="rounded-lg px-3 py-2 text-clay-600 hover:text-clay-900">예약 조회</Link>
        </nav>
      </div>
    </header>
  );
}
