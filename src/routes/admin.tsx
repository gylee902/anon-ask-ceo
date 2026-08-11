import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  adminCreateEvent,
  adminDeleteEvent,
  adminDeleteQuestion,
  adminListEvents,
  adminUpdateEvent,
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
type EventList = Awaited<ReturnType<typeof adminListEvents>>;

function AdminPage() {
  const login = useServerFn(adminLogin);
  const logout = useServerFn(adminLogout);
  const status = useServerFn(adminStatus);
  const list = useServerFn(adminListQuestions);
  const updateQuestion = useServerFn(adminUpdateQuestion);
  const updateComment = useServerFn(adminUpdateComment);
  const removeQuestion = useServerFn(adminDeleteQuestion);
  const listEvents = useServerFn(adminListEvents);
  const createEvent = useServerFn(adminCreateEvent);
  const updateEvent = useServerFn(adminUpdateEvent);
  const removeEvent = useServerFn(adminDeleteEvent);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventList>([]);
  const [eventId, setEventId] = useState<string>("");
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [audienceDraft, setAudienceDraft] = useState<Record<string, string>>({});

  async function refresh(id?: string) {
    try {
      const [evts, data] = await Promise.all([
        listEvents(),
        list({ data: (id ?? eventId) ? { eventId: (id ?? eventId) as string } : {} }),
      ]);
      setEvents(evts);
      setBoard(data);
    } catch {
      setAuthed(false);
    }
  }

  async function selectEvent(id: string) {
    setEventId(id);
    setBoard(await list({ data: id ? { eventId: id } : {} }));
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createEvent({
        data: { slug: newSlug, title: newTitle, subtitle: newSubtitle },
      });
      setNewSlug("");
      setNewTitle("");
      setNewSubtitle("");
      toast.success("새 회차 페이지를 만들었습니다.");
      void refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "회차 생성에 실패했습니다.");
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
        <div className="mx-auto grid w-full max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-6 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">운영자 관리</h1>
            <p className="mt-1 text-xs text-brand-foreground/70">
              전체 {questions.length}건 · 숨김 {questions.filter((q) => q.is_hidden).length}건
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-xs">
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

      <main className="mx-auto w-full max-w-5xl space-y-3 px-4 py-8 sm:px-8">
        <section className="card-surface p-5">
          <h2 className="text-base font-semibold text-foreground">타운홀 회차 관리</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            회차별로 별도 페이지(주소)가 만들어집니다. 예: 주소에 <code>2026-09</code>를 입력하면
            <code> /s/2026-09</code> 링크가 생성됩니다.
          </p>

          <form onSubmit={handleCreateEvent} className="mt-4 grid gap-2 sm:grid-cols-[10rem_1fr_1fr_auto]">
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="주소 (예: 2026-09)"
              className="rounded-lg border border-input bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="회차 이름 (예: 9월 타운홀)"
              className="rounded-lg border border-input bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <input
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              placeholder="부제 (선택)"
              className="rounded-lg border border-input bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              회차 만들기
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="grid gap-2 rounded-lg border border-border px-3.5 py-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{ev.title}</p>
                  <p className="mt-0.5 truncate text-muted-foreground">
                    /s/{ev.slug} · {ev.is_open ? "접수중" : "마감"} ·{" "}
                    {ev.is_published ? "공개" : "비공개"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void selectEvent(ev.id)}
                    className={`rounded-lg border px-3 py-1.5 font-medium ${
                      eventId === ev.id ? "border-brand bg-brand text-brand-foreground" : "border-border"
                    }`}
                  >
                    질문 보기
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateEvent({ data: { id: ev.id, isOpen: !ev.is_open } }).then(() => refresh())
                    }
                    className="rounded-lg border border-border px-3 py-1.5 font-medium"
                  >
                    {ev.is_open ? "접수 마감" : "접수 열기"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void updateEvent({ data: { id: ev.id, isPublished: !ev.is_published } }).then(() =>
                        refresh(),
                      )
                    }
                    className="rounded-lg border border-border px-3 py-1.5 font-medium"
                  >
                    {ev.is_published ? "비공개" : "공개"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm("이 회차와 모든 질문·댓글이 삭제됩니다. 계속할까요?")) return;
                      void removeEvent({ data: { id: ev.id } }).then(() => {
                        setEventId("");
                        void refresh("");
                      });
                    }}
                    className="rounded-lg border border-destructive/40 px-3 py-1.5 font-medium text-destructive"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {eventId && (
            <button
              type="button"
              onClick={() => void selectEvent("")}
              className="mt-3 text-xs text-muted-foreground underline"
            >
              전체 회차 질문 보기
            </button>
          )}
        </section>

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
                    void updateQuestion({ data: { id: q.id, isAnswered: !q.is_answered } }).then(() => refresh())
                  }
                  className="rounded-lg border border-border px-3 py-1.5 font-medium hover:border-brand/50"
                >
                  {q.is_answered ? "답변 완료 해제" : "답변 완료 표시"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void updateQuestion({ data: { id: q.id, isHidden: !q.is_hidden } }).then(() => refresh())
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
                    void removeQuestion({ data: { id: q.id } }).then(() => refresh());
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
                          void updateComment({ data: { id: c.id, isHidden: !c.is_hidden } }).then(() => refresh())
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
