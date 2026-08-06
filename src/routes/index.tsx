import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/townhall/SiteChrome";
import { QuestionCard, QuestionComposer } from "@/components/townhall/QuestionCard";
import { useBoard } from "@/hooks/useTownhall";
import { CATEGORIES, getVoterToken } from "@/lib/townhall";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CEO 타운홀 미팅 사전 질문 | 익명 실시간 질문 게시판" },
      {
        name: "description",
        content:
          "로그인 없이 링크만으로 참여하는 CEO 타운홀 사전 질문 페이지. 인사·복리후생·조직문화·회사 방향성 등 카테고리별로 익명 질문과 공감, 댓글을 실시간으로 남겨보세요.",
      },
      { property: "og:title", content: "CEO 타운홀 미팅 사전 질문" },
      {
        property: "og:description",
        content: "익명으로 남기는 CEO 타운홀 사전 질문. 카테고리별 질문·공감·댓글을 실시간으로 공유합니다.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type SortKey = "popular" | "latest";

function Index() {
  const { data, isLoading, isError } = useBoard();
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader questionCount={data?.questions.length} />

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <QuestionComposer />

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              접수된 질문
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {view.length}건
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="검색"
                className="w-32 rounded-lg border border-input bg-surface px-3 py-2 text-xs outline-none focus:border-brand sm:w-44"
              />
              <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs">
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

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
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
            {isLoading && (
              <div className="card-surface p-6 text-sm text-muted-foreground">불러오는 중...</div>
            )}
            {isError && (
              <div className="card-surface p-6 text-sm text-destructive">
                질문을 불러오지 못했습니다. 새로고침해주세요.
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
