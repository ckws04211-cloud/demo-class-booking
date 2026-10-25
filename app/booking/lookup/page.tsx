import LookupForm from "@/components/LookupForm";

export const metadata = { title: "예약 조회" };

export default function Lookup() {
  return (
    <div className="container-x max-w-xl py-14">
      <h1 className="font-serif text-3xl font-bold">예약 조회·취소</h1>
      <p className="mt-2 text-clay-500">예약 완료 화면에서 받은 예약 코드와 휴대폰 번호를 입력해 주세요.</p>
      <div className="mt-8"><LookupForm /></div>
    </div>
  );
}
