import Image from "next/image";
import Link from "next/link";
import { classes, heroImage, won } from "@/lib/catalog";

const steps = [
  { t: "클래스 선택", d: "원하는 클래스와 날짜, 시간을 고르세요." },
  { t: "정보 입력·결제", d: "예약자 정보를 입력하고 카드로 결제합니다." },
  { t: "예약 확정", d: "예약 코드가 발급되며, 조회·취소가 가능합니다." },
];

const faqs = [
  { q: "도자기가 처음인데 괜찮을까요?", a: "모든 클래스는 입문자 기준으로 진행됩니다. 강사가 처음부터 끝까지 함께합니다." },
  { q: "완성작은 언제 받을 수 있나요?", a: "건조·유약·소성 과정을 거쳐 약 3주 후 입력하신 주소로 택배 발송해 드립니다." },
  { q: "예약 취소는 어떻게 하나요?", a: "클래스 시작 24시간 전까지 '예약 조회'에서 직접 취소하면 전액 환불됩니다." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-clay-900 text-white">
        <Image src={heroImage} alt="" fill priority className="object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-clay-900 via-clay-900/70 to-transparent" />
        <div className="container-x relative py-28 md:py-40">
          <p className="text-sm font-semibold tracking-[0.2em] text-clay-200">CERAMIC ONE-DAY CLASS</p>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-6xl">
            흙을 만지는 두 시간,
            <br />
            오롯이 나를 위한 시간
          </h1>
          <p className="mt-5 max-w-lg text-clay-100/90">성수동 작은 공방에서 물레, 핸드빌딩, 유약 페인팅을 경험해 보세요. 완성작은 구워서 집으로 보내드립니다.</p>
          <Link href="#classes" className="btn-accent mt-9 px-8 py-4 text-base">클래스 둘러보기</Link>
        </div>
      </section>

      <section id="classes" className="container-x scroll-mt-20 py-20 md:py-24">
        <h2 className="font-serif text-3xl font-bold md:text-4xl">클래스</h2>
        <p className="mt-2 text-clay-500">모든 클래스는 재료비와 소성비가 포함된 가격입니다.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {classes.map((c) => (
            <Link key={c.slug} href={`/classes/${c.slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={c.image} alt={c.title} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-clay-800">{c.level}</span>
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl font-bold">{c.title}</h3>
                <p className="mt-1 text-sm text-clay-500">{c.subtitle}</p>
                <div className="mt-5 flex items-end justify-between">
                  <span className="text-sm text-clay-400">{c.durationMin}분 · 정원 {c.capacity}명</span>
                  <span className="text-lg font-bold text-clay-800">{won(c.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-x">
          <h2 className="font-serif text-3xl font-bold">예약 방법</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.t} className="rounded-2xl bg-clay-50 p-7">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-clay-800 font-bold text-white">{i + 1}</span>
                <h3 className="mt-5 text-lg font-bold">{s.t}</h3>
                <p className="mt-1 text-clay-500">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x py-20">
        <h2 className="font-serif text-3xl font-bold">자주 묻는 질문</h2>
        <div className="mt-8 divide-y divide-clay-100 border-y border-clay-100">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                {f.q}
                <span className="text-clay-400 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-clay-500">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
