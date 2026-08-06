import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

async function fetchBoard(): Promise<BoardData> {
  const [q, c, ql, cl] = await Promise.all([
    supabase
      .from("questions")
      .select("id, category, title, body, nickname, is_answered, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("id, question_id, body, nickname, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("question_likes").select("question_id, voter_token"),
    supabase.from("comment_likes").select("comment_id, voter_token"),
  ]);
  if (q.error) throw q.error;
  if (c.error) throw c.error;
  if (ql.error) throw ql.error;
  if (cl.error) throw cl.error;
  return {
    questions: q.data ?? [],
    comments: c.data ?? [],
    questionLikes: ql.data ?? [],
    commentLikes: cl.data ?? [],
  };
}

export function useBoard() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["townhall-board"], queryFn: fetchBoard });

  useEffect(() => {
    const channel = supabase
      .channel("townhall-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, () => {
        queryClient.invalidateQueries({ queryKey: ["townhall-board"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        queryClient.invalidateQueries({ queryKey: ["townhall-board"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "question_likes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["townhall-board"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_likes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["townhall-board"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
