import { Link } from "@tanstack/react-router";

/**
 * BRAND SLOT — 회사 CI/BI 자리
 * 로고 파일을 받으면 아래 <BrandMark />의 내용만 <img src={logo} .../> 로 교체하면 됩니다.
 */
function BrandMark() {
  return (
    <div className="flex size-11 items-center justify-center rounded-xl border border-brand-foreground/25 bg-brand-foreground/10 text-[11px] font-semibold tracking-[0.14em] text-brand-foreground/80">
      CI
    </div>
  );
}

export function SiteHeader({ questionCount }: { questionCount?: number }) {
  return (
    <header className="brand-gradient relative overflow-hidden text-brand-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-brand-foreground/10 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-sm font-medium tracking-tight text-brand-foreground/80">
              사내 커뮤니케이션
            </span>
          </Link>
          <Link
            to="/admin"
            className="rounded-full border border-brand-foreground/25 px-3.5 py-1.5 text-xs font-medium text-brand-foreground/75 transition hover:bg-brand-foreground/10"
          >
            운영자
          </Link>
        </div>

        <div className="mt-9 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-foreground/60">
            CEO Town Hall
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-[2.6rem]">
            CEO 타운홀 미팅
            <br className="sm:hidden" /> 사전 질문 받습니다
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-brand-foreground/75 sm:text-base">
            로그인 없이, 이름 없이. 인사·제도·회사 방향성까지 평소 궁금했던 이야기를 남겨주세요.
            남겨주신 질문은 실시간으로 함께 공유되고, 공감이 많은 질문부터 타운홀에서 다룹니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-brand-foreground/12 px-3 py-1.5 text-brand-foreground/85">
              완전 익명 · 작성자 정보 미수집
            </span>
            <span className="rounded-full bg-brand-foreground/12 px-3 py-1.5 text-brand-foreground/85">
              링크만 있으면 누구나 참여
            </span>
            {typeof questionCount === "number" && (
              <span className="rounded-full bg-brand-foreground/12 px-3 py-1.5 text-brand-foreground/85">
                지금까지 {questionCount}개의 질문
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8">
      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        작성자 이름, 사번, 이메일 등 개인을 식별할 수 있는 정보는 저장하지 않습니다. 다만 서로를
        존중하는 표현으로 작성해주시고, 특정 개인을 지목하는 내용은 운영자에 의해 숨김 처리될 수
        있습니다.
      </div>
    </footer>
  );
}
