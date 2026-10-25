import Image from "next/image";
import { notFound } from "next/navigation";
import BookingPanel from "@/components/BookingPanel";
import { getClass, won } from "@/lib/catalog";
import { seatsUsed } from "@/lib/repo";
import { bookingDates, sessionsFor } from "@/lib/schedule";
import { tossClientKey, tossReady } from "@/lib/toss";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = getClass((await params).slug);
  return { title: c?.title ?? "클래스" };
}

export default async function ClassDetail({ params }: { params: Promise<{ slug: string }> }) {
  const c = getClass((await params).slug);
  if (!c) notFound();

  const dates = bookingDates();
  const sessions = dates.flatMap((d) => sessionsFor(c, d.date));
  const used = await seatsUsed(sessions.map((s) => s.id));
  const slots = sessions.map((s) => ({ id: s.id, date: s.date, time: s.time, left: Math.max(0, s.capacity - (used[s.id] ?? 0)) }));

  return (
    <div className="container-x py-10 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="relative aspect-[16/10] overflow-hidden rounded-3xl">
            <Image src={c.image} alt={c.title} fill priority sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {c.gallery.map((g) => (
              <div key={g} className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={g} alt="" fill sizes="30vw" className="object-cover" />
              </div>
            ))}
          </div>
          <span className="mt-8 inline-block rounded-full bg-clay-100 px-3 py-1 text-xs font-bold text-clay-600">{c.level}</span>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">{c.title}</h1>
          <p className="mt-2 text-lg text-clay-500">{c.subtitle}</p>
          <p className="mt-6 leading-relaxed text-clay-700">{c.description}</p>
          <dl className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[["소요 시간", `${c.durationMin}분`], ["정원", `${c.capacity}명`], ["1인", won(c.price)]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white p-4">
                <dt className="text-xs text-clay-400">{k}</dt>
                <dd className="mt-1 font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mt-10 font-bold">포함 사항</h2>
          <ul className="mt-3 space-y-2">
            {c.includes.map((i) => (
              <li key={i} className="flex items-center gap-2 text-clay-700">
                <span className="h-1.5 w-1.5 rounded-full bg-moss-500" /> {i}
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-2xl bg-white p-6 text-sm text-clay-600">
            <p className="font-bold text-clay-800">취소·환불 규정</p>
            <p className="mt-2">클래스 시작 24시간 전까지 예약 조회 페이지에서 취소 시 전액 환불됩니다. 이후에는 취소가 불가합니다.</p>
          </div>
        </div>
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <BookingPanel
            cls={{ slug: c.slug, title: c.title, price: c.price, durationMin: c.durationMin }}
            dates={dates}
            slots={slots}
            clientKey={tossReady() ? tossClientKey() : ""}
          />
        </div>
      </div>
    </div>
  );
}
