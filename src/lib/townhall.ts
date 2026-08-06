export type CategoryKey =
  | "hr_eval"
  | "benefits"
  | "culture"
  | "work_policy"
  | "career"
  | "direction"
  | "business"
  | "it_infra"
  | "etc";

export type Category = {
  key: CategoryKey;
  label: string;
  short: string;
  hint: string;
};

export const CATEGORIES: Category[] = [
  { key: "hr_eval", label: "인사 · 평가 · 보상", short: "평가·보상", hint: "평가 제도, 승진, 연봉, 인센티브" },
  { key: "benefits", label: "복리후생", short: "복리후생", hint: "복지 제도, 지원금, 휴가" },
  { key: "culture", label: "조직문화", short: "조직문화", hint: "소통, 리더십, 일하는 방식" },
  { key: "work_policy", label: "근무제도", short: "근무제도", hint: "재택, 유연근무, 근무시간" },
  { key: "career", label: "커리어 · 성장", short: "커리어", hint: "교육, 직무 이동, 성장 경로" },
  { key: "direction", label: "회사 방향성 · 비전", short: "방향성", hint: "중장기 목표, 비전, 조직 개편" },
  { key: "business", label: "사업 전략", short: "사업전략", hint: "신사업, 시장, 실적" },
  { key: "it_infra", label: "IT · 인프라", short: "IT·인프라", hint: "시스템, 업무 툴, 오피스 환경" },
  { key: "etc", label: "기타", short: "기타", hint: "그 밖의 자유로운 질문" },
];

export function categoryOf(key: string): Category {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1]!;
}

const TOKEN_KEY = "townhall_voter_token";

export function getVoterToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = (crypto.randomUUID?.() ?? String(Math.random()).slice(2) + Date.now().toString(36)).replace(/-/g, "");
    window.localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}
