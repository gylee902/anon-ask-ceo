import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, categoryOf, formatWhen, getVoterToken } from "@/lib/townhall";
import type { CommentRow, QuestionRow } from "@/hooks/useTownhall";
import { toast } from "sonner";

type Props = {
  question: QuestionRow;
  comments: CommentRow[];
  likeCount: number;
  liked: boolean;
  commentLikes: Map<string, { count: number; liked: boolean }>;
};

export function QuestionCard({ question, comments, likeCount, liked, commentLikes }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const category = categoryOf(question.category);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["townhall-board"] });

  async function toggleQuestionLike() {
    const token = getVoterToken();
    if (liked) {
      await supabase
        .from("question_likes")
        .delete()
        .eq("question_id", question.id)
        .eq("voter_token", token);
    } else {
      await supabase.from("question_likes").insert({ question_id: question.id, voter_token: token });
    }
    void invalidate();
  }

  async function toggleCommentLike(commentId: string, isLiked: boolean) {
    const token = getVoterToken();
    if (isLiked) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("voter_token", token);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: commentId, voter_token: token });
    }
    void invalidate();
  }

  async function submitComment() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from("comments").insert({
      question_id: question.id,
      body,
      author_token: getVoterToken(),
    });
    setSending(false);
    if (error) {
      toast.error("댓글 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setDraft("");
    void invalidate();
  }

  return (
    <article className="card-surface p-5 transition hover:shadow-[var(--shadow-lift-value)] sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground">
          {category.short}
        </span>
        {question.is_answered && (
          <span className="rounded-full bg-brand-accent/15 px-2.5 py-1 text-xs font-semibold text-brand-accent">
            답변 완료
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {question.nickname ? `${question.nickname} · ` : "익명 · "}
          {formatWhen(question.created_at)}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-foreground sm:text-lg">
        {question.title}
      </h3>
      {question.body && (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {question.body}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void toggleQuestionLike()}
          aria-pressed={liked}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            liked
              ? "border-brand bg-brand text-brand-foreground"
              : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-foreground"
          }`}
        >
          <span aria-hidden>♥</span> 공감 {likeCount}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-brand/40 hover:text-foreground"
        >
          <span aria-hidden>💬</span> 댓글 {comments.length}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {comments.map((comment) => {
            const info = commentLikes.get(comment.id) ?? { count: 0, liked: false };
            return (
              <div key={comment.id} className="rounded-lg bg-muted/60 px-3.5 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {comment.body}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>익명 · {formatWhen(comment.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => void toggleCommentLike(comment.id, info.liked)}
                    className={`ml-auto rounded-full px-2 py-0.5 transition ${
                      info.liked ? "bg-brand text-brand-foreground" : "hover:text-foreground"
                    }`}
                  >
                    ♥ {info.count}
                  </button>
                </div>
              </div>
            );
          })}
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground">아직 댓글이 없어요. 첫 의견을 남겨보세요.</p>
          )}

          <div className="flex items-start gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
              rows={2}
              placeholder="익명으로 의견을 더해주세요"
              className="min-h-[44px] flex-1 resize-y rounded-lg border border-input bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-ring/30"
            />
            <button
              type="button"
              disabled={sending || !draft.trim()}
              onClick={() => void submitComment()}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground transition disabled:opacity-40"
            >
              등록
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export function QuestionComposer() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(CATEGORIES[0]!.key as string);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const hint = useMemo(() => categoryOf(category).hint, [category]);

  async function submit() {
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error("질문을 2자 이상 입력해주세요.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("questions").insert({
      category,
      title: trimmed,
      body: body.trim() || null,
      author_token: getVoterToken(),
    });
    setSending(false);
    if (error) {
      toast.error("질문 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    setTitle("");
    setBody("");
    toast.success("질문이 익명으로 등록되었습니다.");
    void queryClient.invalidateQueries({ queryKey: ["townhall-board"] });
  }

  return (
    <section className="card-surface p-5 sm:p-6">
      <h2 className="text-base font-semibold text-foreground">질문 남기기</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        작성자 정보는 저장되지 않습니다. 편하게 물어보세요.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              category === c.key
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-surface text-muted-foreground hover:border-brand/40 hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">예시: {hint}</p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 200))}
        placeholder="한 줄로 질문을 요약해주세요"
        className="mt-4 w-full rounded-lg border border-input bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-ring/30"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        rows={3}
        placeholder="배경이나 상황을 덧붙이면 더 정확한 답변을 받을 수 있어요. (선택)"
        className="mt-2 w-full resize-y rounded-lg border border-input bg-surface px-3.5 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-ring/30"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{title.length}/200</span>
        <button
          type="button"
          disabled={sending}
          onClick={() => void submit()}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          {sending ? "등록 중..." : "익명으로 등록"}
        </button>
      </div>
    </section>
  );
}
