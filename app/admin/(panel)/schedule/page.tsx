import { classes } from "@/lib/catalog";
import { seatsUsed } from "@/lib/repo";
import { bookingDates, fmtSession, sessionsFor } from "@/lib/schedule";

export default async function Schedule() {
  const dates = bookingDates().slice(0, 7);
  const sessions = dates.flatMap((d) => classes.flatMap((c) => sessionsFor(c, d.date)));
  const used = await seatsUsed(sessions.map((s) => s.id));

  return (
    <>
      <h1 className="font-serif text-2xl font-bold">회차 현황</h1>
      <p className="mt-1 text-sm text-clay-500">앞으로 7일(영업일) 기준 · 결제 완료 + 결제 대기(10분 홀드) 좌석</p>
      <div className="mt-5 space-y-4">
        {dates.map((d) => {
          const list = sessions.filter((s) => s.date === d.date).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <section key={d.date} className="card p-5">
              <h2 className="font-bold">{fmtSession({ date: d.date, time: "" }).trim()}</h2>
              {list.length === 0 ? <p className="mt-2 text-sm text-clay-400">남은 회차가 없습니다.</p> : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {list.map((s) => {
                    const c = classes.find((x) => x.slug === s.classSlug)!;
                    const u = used[s.id] ?? 0;
                    const full = u >= s.capacity;
                    return (
                      <div key={s.id} className={`rounded-xl border p-3 text-sm ${full ? "border-clay-800 bg-clay-800 text-white" : "border-clay-100"}`}>
                        <div className="flex justify-between font-semibold"><span>{s.time}</span><span>{u}/{s.capacity}</span></div>
                        <p className={`mt-0.5 truncate text-xs ${full ? "text-clay-200" : "text-clay-400"}`}>{c.title}{full && " · 마감"}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
