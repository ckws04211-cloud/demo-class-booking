export type ClassItem = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number; // 1인 가격(원)
  durationMin: number;
  capacity: number; // 회차당 정원
  level: string;
  includes: string[];
  slots: string[]; // "HH:mm" (KST)
  image: string;
  gallery: string[];
};

const u = (id: string, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const classes: ClassItem[] = [
  {
    slug: "wheel-oneday",
    title: "물레 원데이 클래스",
    subtitle: "처음 만지는 흙, 나만의 그릇 하나",
    description:
      "물레 위에서 흙을 올리고 모양을 잡아 컵이나 그릇을 직접 만들어 봅니다. 완성작은 유약 작업과 가마 소성을 거쳐 약 3주 후 택배로 보내드립니다.",
    price: 65000,
    durationMin: 120,
    capacity: 6,
    level: "입문",
    includes: ["재료비·소성비 포함", "완성작 1점 택배 발송", "앞치마 제공"],
    slots: ["11:00", "14:00", "17:00"],
    image: u("photo-1607556671927-78a6605e290b"),
    gallery: [u("photo-1590605105526-5c08f63f89aa", 800), u("photo-1609881583302-61548332039c", 800)],
  },
  {
    slug: "handbuilding-plate",
    title: "핸드빌딩 접시 만들기",
    subtitle: "손으로 빚는 나만의 플레이트",
    description:
      "판 성형 기법으로 흙을 밀고 잘라 접시와 트레이를 만듭니다. 물레가 처음이라 부담스러운 분, 아이와 함께 오는 분께 추천합니다.",
    price: 48000,
    durationMin: 90,
    capacity: 8,
    level: "입문",
    includes: ["재료비·소성비 포함", "접시 2점 택배 발송", "8세 이상 참여 가능"],
    slots: ["10:30", "13:30", "16:00"],
    image: u("photo-1604095616439-216735abec0c"),
    gallery: [u("photo-1721190601155-1b98d316bbe2", 800), u("photo-1721328004336-c19ee38adcd1", 800)],
  },
  {
    slug: "glaze-workshop",
    title: "유약 페인팅 워크숍",
    subtitle: "초벌 그릇에 색을 입히는 시간",
    description:
      "초벌 소성된 그릇에 붓으로 유약을 칠해 나만의 패턴을 완성합니다. 흙을 만지지 않아 손이 깨끗하고, 결과물을 고르는 재미가 있습니다.",
    price: 39000,
    durationMin: 90,
    capacity: 10,
    level: "누구나",
    includes: ["초벌 그릇 2점 중 선택", "유약 12색", "완성작 택배 발송"],
    slots: ["12:00", "15:30"],
    image: u("photo-1673252413454-162352c3df01"),
    gallery: [u("photo-1673339065013-f8411fb93848", 800), u("photo-1613667138005-c281de70406a", 800)],
  },
];

export const getClass = (slug: string) => classes.find((c) => c.slug === slug) ?? null;
export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const heroImage = u("photo-1609881582722-4a8ab7cd54d8", 2000);
