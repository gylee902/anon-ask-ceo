import { useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/townhall/SiteChrome";
import { QuestionCard, QuestionComposer } from "@/components/townhall/QuestionCard";
import { useBoard, useEvents, type EventRow } from "@/hooks/useTownhall";
import { CATEGORIES, getVoterToken } from "@/lib/townhall";

type SortKey = "popular" | "latest";

export function TownhallBoard({ slug }: { slug?: string | undefined }) {
  const { data: events, isLoading: eventsLoading } = useEvents();

  const event: EventRow | undefined = useMemo(() => {
    if (!events || events.length === 0) return undefined;
    if (slug) return events.find((e) => e.slug === slug);
    return events.find((e) => e.is_open) ?? events[0];
  }, [events, slug]);

  const { data, isLoading, isError } = useBoard(event?.id);
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [search, setSearch] = useState("");

  const token = typeof window !== "undefined" ? getVoterToken() : "";

  const view = useMemo(() => {
    if (!data) return [];
    const likeMap = new Map<string, { count: number; liked: boolean }>();
    for (const like of data.questionLikes) {
      const prev = likeMap.get(like.question_id) ?? { count: 0, liked: false };
      likeMap.set(like.question_id, {
        count: prev.count + 1,
        liked: prev.liked || like.voter_token === token,
      });
    }
    const commentLikeMap = new Map<string, { count: number; liked: boolean }>();
    for (const like of data.commentLikes) {
      const prev = commentLikeMap.get(like.comment_id) ?? { count: 0, liked: false };
      commentLikeMap.set(like.comment_id, {
        count: prev.count + 1,
        liked: prev.liked || like.voter_token === token,
      });
    }

    const needle = search.trim().toLowerCase();
    const rows = data.questions
      .filter((q) => (filter === "all" ? true : q.category === filter))
      .filter((q) =>
        needle
          ? q.title.toLowerCase().includes(needle) || (q.body ?? "").toLowerCase().includes(needle)
          : true,
      )
      .map((q) => ({
        question: q,
        comments: data.comments.filter((c) => c.question_id === q.id),
        like: likeMap.get(q.id) ?? { count: 0, liked: false },
        commentLikes: commentLikeMap,
      }));

    if (sort === "popular") {
      rows.sort(
        (a, b) =>
          b.like.count - a.like.count ||
          new Date(b.question.created_at).getTime() - new Date(a.question.created_at).getTime(),
      );
    }
    return rows;
  }, [data, filter, sort, search, token]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of data?.questions ?? []) map.set(q.category, (map.get(q.category) ?? 0) + 1);
    return map;
  }, [data]);

  if (!eventsLoading && !event) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader events={events} />
        <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
          <div className="card-surface p-8 text-center text-sm text-muted-foreground">
            공개된 타운홀 회차가 없습니다. 운영자 페이지에서 회차를 만들어주세요.
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader event={event} events={events} questionCount={data?.questions.length} />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        {event?.is_open ? (
          <QuestionComposer eventId={event.id} />
        ) : (
          <div className="card-surface p-5 text-sm text-muted-foreground">
            이 회차는 사전 질문 접수가 마감되었습니다. 남겨진 질문은 계속 열람하실 수 있습니다.
          </div>
        )}

        <section className="mt-10">
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              접수된 질문
              <span className="ml-2 text-sm font-normal text-muted-foreground">{view.length}건</span>
            </h2>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색"
                className="w-full min-w-0 rounded-lg border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-brand sm:w-44 sm:text-xs"
              />
              <div className="flex shrink-0 rounded-lg border border-border bg-surface p-0.5 text-xs">
                {(
                  [
                    ["popular", "공감순"],
                    ["latest", "최신순"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={`rounded-md px-3 py-1.5 font-medium transition ${
                      sort === key ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === "all"
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-brand/40"
              }`}
            >
              전체 {data?.questions.length ?? 0}
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  filter === c.key
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-surface text-muted-foreground hover:border-brand/40"
                }`}
              >
                {c.label} {counts.get(c.key) ?? 0}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {(isLoading || eventsLoading) && (
              <div className="card-surface p-6 text-sm text-muted-foreground">불러오는 중...</div>
            )}
            {isError && (
              <div className="card-surface p-6 text-sm text-destructive">
                질문을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
              </div>
            )}
            {!isLoading && !isError && view.length === 0 && (
              <div className="card-surface p-8 text-center text-sm text-muted-foreground">
                아직 등록된 질문이 없습니다. 첫 질문을 남겨보세요.
              </div>
            )}
            {view.map((row) => (
              <QuestionCard
                key={row.question.id}
                question={row.question}
                comments={row.comments}
                likeCount={row.like.count}
                liked={row.like.liked}
                commentLikes={row.commentLikes}
              />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
