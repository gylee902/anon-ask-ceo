import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  is_open: boolean;
  sort_order: number;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  category: string;
  title: string;
  body: string | null;
  nickname: string | null;
  is_answered: boolean;
  created_at: string;
};

export type CommentRow = {
  id: string;
  question_id: string;
  body: string;
  nickname: string | null;
  created_at: string;
};

export type BoardData = {
  questions: QuestionRow[];
  comments: CommentRow[];
  questionLikes: { question_id: string; voter_token: string }[];
  commentLikes: { comment_id: string; voter_token: string }[];
};

async function fetchEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, slug, title, subtitle, description, is_open, sort_order, created_at")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchBoard(eventId: string): Promise<BoardData> {
  const q = await supabase
    .from("questions")
    .select("id, category, title, body, nickname, is_answered, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (q.error) throw q.error;
  const questions = q.data ?? [];
  const ids = questions.map((row) => row.id);
  if (ids.length === 0) {
    return { questions, comments: [], questionLikes: [], commentLikes: [] };
  }

  const [c, ql] = await Promise.all([
    supabase
      .from("comments")
      .select("id, question_id, body, nickname, created_at")
      .in("question_id", ids)
      .order("created_at", { ascending: true }),
    supabase.from("question_likes").select("question_id, voter_token").in("question_id", ids),
  ]);
  if (c.error) throw c.error;
  if (ql.error) throw ql.error;

  const comments = c.data ?? [];
  const commentIds = comments.map((row) => row.id);
  let commentLikes: { comment_id: string; voter_token: string }[] = [];
  if (commentIds.length > 0) {
    const cl = await supabase
      .from("comment_likes")
      .select("comment_id, voter_token")
      .in("comment_id", commentIds);
    if (cl.error) throw cl.error;
    commentLikes = cl.data ?? [];
  }

  return { questions, comments, questionLikes: ql.data ?? [], commentLikes };
}

/** Subscribes once to all board tables and refreshes every board query. */
function useRealtimeBoard() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: ["townhall-board"] });
      void queryClient.invalidateQueries({ queryKey: ["townhall-events"] });
    };
    const channel = supabase
      .channel("townhall-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "question_likes" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_likes" }, invalidate)
      .subscribe();

    // Safety net: if a realtime message is missed (mobile sleep, network switch),
    // refresh when the tab becomes visible again and on a slow interval.
    const onVisible = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(invalidate, 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useEvents() {
  useRealtimeBoard();
  return useQuery({ queryKey: ["townhall-events"], queryFn: fetchEvents });
}

export function useBoard(eventId: string | undefined) {
  useRealtimeBoard();
  return useQuery({
    queryKey: ["townhall-board", eventId],
    queryFn: () => fetchBoard(eventId!),
    enabled: !!eventId,
  });
}
