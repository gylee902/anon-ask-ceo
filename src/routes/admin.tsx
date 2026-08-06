import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminDeleteQuestion,
  adminListQuestions,
  adminLogin,
  adminLogout,
  adminStatus,
  adminUpdateComment,
  adminUpdateQuestion,
} from "@/lib/townhall-admin.functions";
import { categoryOf, formatWhen } from "@/lib/townhall";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "운영자 관리 | CEO 타운홀 사전 질문" },
      {
        name: "description",
        content: "CEO 타운홀 사전 질문 페이지의 운영자 화면입니다. 답변 완료 표시, 질문 숨김 및 삭제를 관리합니다.",
      },
      { property: "og:title", content: "운영자 관리 | CEO 타운홀 사전 질문" },
      { property: "og:description", content: "타운홀 사전 질문 운영자 관리 화면" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Board = Awaited<ReturnType<typeof adminListQuestions>>;

function AdminPage() {
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const status = useServerFn(adminStatus);
  const list = useServerFn(adminListQuestions);
  const updateQuestion = useServerFn(adminUpdateQuestion);
  const updateComment = useServerFn(adminUpdateComment);
  const removeQuestion = useServerFn(adminDeleteQuestion);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function refresh() {
    try {
      setBoard(await list());
    } catch {
      setAuthed(false);
    }
  }

  useEffect(() => {
    void (async () => {
      const res = await status();
      setAuthed(res.isAdmin);
      if (res.isAdmin) void refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await login({ data: { password } });
    if (!res.ok) {
      toast.error("비밀번호가 올바르지 않습니다.");
      return;
    }
    setPassword("");
    setAuthed(true);
    void refresh();
  }

  if (authed === null) {
    return <div className="p-10 text-sm text-muted-foreground">확인 중...</div>;
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <form onSubmit={handleLogin} className="card-surface w-full max-w-sm p-6">
          <h1 className="text-lg font-semibold text-foreground">운영자 로그인</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            타운홀 사전 질문 관리를 위한 공유 비밀번호를 입력하세요.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-4 w-full rounded-lg border border-input bg-surface px-3.5 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-ring/30"
          />
          <button
            type="submit"
            className="mt-3 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            입장
          </button>
          <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground underline">
            질문 페이지로 돌아가기
          </Link>
        </form>
      </div>
    );
  }

  const questions = board?.questions ?? [];
  const likeCount = (id: string) => (board?.likes ?? []).filter((q) => q === id).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="brand-gradient text-brand-foreground">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight">운영자 관리</h1>
            <p className="mt-1 text-xs text-brand-foreground/70">
              전체 {questions.length}건 · 숨김 {questions.filter((q) => q.is_hidden).length}건
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link
              to="/"
              className="rounded-full border border-brand-foreground/25 px-3 py-1.5 text-brand-foreground/80"
            >
              질문 페이지
            </Link>
            <button
              type="button"
              onClick={() => void logout().then(() => setAuthed(false))}
              className="rounded-full border border-brand-foreground/25 px-3 py-1.5 text-brand-foreground/80"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-3 px-5 py-8 sm:px-8">
        {questions.map((q) => {
          const comments = (board?.comments ?? []).filter((c) => c.question_id === q.id);
          return (
            <article
              key={q.id}
              className={`card-surface p-5 ${q.is_hidden ? "opacity-55" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-brand-soft px-2.5 py-1 font-semibold text-accent-foreground">
                  {categoryOf(q.category).short}
                </span>
                {q.is_answered && (
                  <span className="rounded-full bg-brand-accent/15 px-2.5 py-1 font-semibold text-brand-accent">
                    답변 완료
                  </span>
                )}
                {q.is_hidden && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-semibold text-destructive">
                    숨김
                  </span>
                )}
                <span className="ml-auto text-muted-foreground">
                  ♥ {likeCount(q.id)} · 💬 {comments.length} · {formatWhen(q.created_at)}
                </span>
              </div>

              <h2 className="mt-3 text-base font-semibold text-foreground">{q.title}</h2>
              {q.body && (
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{q.body}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    void updateQuestion({ data: { id: q.id, isAnswered: !q.is_answered } }).then(
                      refresh,
                    )
                  }
                  className="rounded-lg border border-border px-3 py-1.5 font-medium hover:border-brand/50"
                >
                  {q.is_answered ? "답변 완료 해제" : "답변 완료 표시"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void updateQuestion({ data: { id: q.id, isHidden: !q.is_hidden } }).then(refresh)
                  }
                  className="rounded-lg border border-border px-3 py-1.5 font-medium hover:border-brand/50"
                >
                  {q.is_hidden ? "숨김 해제" : "숨기기"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === q.id ? null : q.id)}
                  className="rounded-lg border border-border px-3 py-1.5 font-medium hover:border-brand/50"
                >
                  댓글 {comments.length}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm("이 질문과 댓글을 완전히 삭제할까요?")) return;
                    void removeQuestion({ data: { id: q.id } }).then(refresh);
                  }}
                  className="rounded-lg border border-destructive/40 px-3 py-1.5 font-medium text-destructive"
                >
                  삭제
                </button>
              </div>

              {openId === q.id && (
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground">댓글이 없습니다.</p>
                  )}
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className={`flex items-start gap-3 rounded-lg bg-muted/60 px-3.5 py-2.5 ${
                        c.is_hidden ? "opacity-50" : ""
                      }`}
                    >
                      <p className="flex-1 whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
                      <button
                        type="button"
                        onClick={() =>
                          void updateComment({ data: { id: c.id, isHidden: !c.is_hidden } }).then(
                            refresh,
                          )
                        }
                        className="shrink-0 rounded-md border border-border px-2 py-1 text-xs"
                      >
                        {c.is_hidden ? "숨김 해제" : "숨기기"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </main>
    </div>
  );
}
