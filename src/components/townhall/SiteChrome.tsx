import { Link } from "@tanstack/react-router";
import ciAsset from "@/assets/kolon-global-ci.png.asset.json";
import biAsset from "@/assets/culture-bi.png.asset.json";
import type { EventRow } from "@/hooks/useTownhall";

export function SiteHeader({
  event,
  events,
  questionCount,
}: {
  event?: EventRow | undefined;
  events?: EventRow[] | undefined;
  questionCount?: number | undefined;
}) {
  const others = (events ?? []).filter((e) => e.id !== event?.id);

  return (
    <header>
      {/* Brand bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img
              src={ciAsset.url}
              alt="코오롱글로벌 CI"
              className="h-6 w-auto shrink-0 sm:h-7"
              loading="eager"
            />
            <span className="hidden h-5 w-px shrink-0 bg-border sm:block" />
            <span className="truncate text-xs font-medium tracking-tight text-muted-foreground sm:text-sm">
              타운홀미팅 사전 Q&amp;A
            </span>
          </Link>
          <Link
            to="/admin"
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-brand/50 hover:text-foreground"
          >
            운영자
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="brand-gradient relative overflow-hidden text-brand-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-brand-foreground/10 blur-3xl"
        />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-9 sm:px-8 sm:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-foreground/60 sm:text-xs">
            CEO Town Hall
          </p>
          <h1 className="mt-3 text-[1.75rem] font-bold leading-tight tracking-tight sm:text-[2.6rem]">
            CEO 타운홀 미팅 사전 Q&amp;A
          </h1>
          {event?.subtitle && (
            <p className="mt-2 text-sm font-medium text-brand-foreground/80">
              대상 : {event.subtitle}
            </p>
          )}
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-brand-foreground/80 sm:text-base">
            CEO에게 궁금한 점, 제안하고 싶은 이야기 등 다양한 의견을 자유롭게 남겨주세요.
            <br className="hidden sm:block" />
            다음에 공감하는 게시물에는 좋아요와 댓글을 남겨주세요.
          </p>
          {event?.description && (
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-brand-foreground/70">
              {event.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-brand-foreground/12 px-3 py-1.5 text-brand-foreground/85">
              완전 익명 · 작성자 정보 미수집
            </span>
            {typeof questionCount === "number" && (
              <span className="rounded-full bg-brand-foreground/12 px-3 py-1.5 text-brand-foreground/85">
                지금까지 {questionCount}개의 의견
              </span>
            )}
            {event && !event.is_open && (
              <span className="rounded-full bg-brand-foreground/20 px-3 py-1.5 font-medium text-brand-foreground">
                접수 마감
              </span>
            )}
          </div>

          {others.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {[...(events ?? [])].map((e) => {
                const active = e.id === event?.id;
                return (
                  <Link
                    key={e.id}
                    to="/s/$slug"
                    params={{ slug: e.slug }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-brand-foreground text-brand"
                        : "bg-brand-foreground/12 text-brand-foreground/80 hover:bg-brand-foreground/20"
                    }`}
                  >
                    {e.title}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 pb-14 pt-10 sm:px-8">
      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-4 text-xs leading-relaxed text-muted-foreground sm:px-5">
        작성자 이름, 사번, 이메일 등 개인을 식별할 수 있는 정보는 저장하지 않습니다.
        <br />
        다만 서로를 존중하는 표현으로 작성해주시고, 특정 개인을 지목하는 내용은 운영자에 의해 숨김
        처리될 수 있습니다.
      </div>
      <div className="mt-6 flex justify-center">
        <img src={biAsset.url} alt="기업문화혁신실 BI" className="h-9 w-auto opacity-70 sm:h-11" />
      </div>
    </footer>
  );
}
