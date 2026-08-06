CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  body text,
  nickname text,
  is_answered boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  author_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  body text NOT NULL,
  nickname text,
  is_hidden boolean NOT NULL DEFAULT false,
  author_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.question_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  voter_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, voter_token)
);

CREATE TABLE public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  voter_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, voter_token)
);

CREATE INDEX idx_comments_question ON public.comments(question_id);
CREATE INDEX idx_question_likes_question ON public.question_likes(question_id);
CREATE INDEX idx_comment_likes_comment ON public.comment_likes(comment_id);

GRANT SELECT, INSERT ON public.questions TO anon, authenticated;
GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.question_likes TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
GRANT ALL ON public.comments TO service_role;
GRANT ALL ON public.question_likes TO service_role;
GRANT ALL ON public.comment_likes TO service_role;

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions_public_read" ON public.questions FOR SELECT TO anon, authenticated USING (is_hidden = false);
CREATE POLICY "questions_public_insert" ON public.questions FOR INSERT TO anon, authenticated WITH CHECK (is_hidden = false AND is_answered = false AND char_length(title) BETWEEN 2 AND 200 AND (body IS NULL OR char_length(body) <= 2000) AND (nickname IS NULL OR char_length(nickname) <= 30));

CREATE POLICY "comments_public_read" ON public.comments FOR SELECT TO anon, authenticated USING (is_hidden = false);
CREATE POLICY "comments_public_insert" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (is_hidden = false AND char_length(body) BETWEEN 1 AND 1000 AND (nickname IS NULL OR char_length(nickname) <= 30));

CREATE POLICY "question_likes_read" ON public.question_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "question_likes_insert" ON public.question_likes FOR INSERT TO anon, authenticated WITH CHECK (char_length(voter_token) BETWEEN 8 AND 64);
CREATE POLICY "question_likes_delete" ON public.question_likes FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "comment_likes_read" ON public.comment_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comment_likes_insert" ON public.comment_likes FOR INSERT TO anon, authenticated WITH CHECK (char_length(voter_token) BETWEEN 8 AND 64);
CREATE POLICY "comment_likes_delete" ON public.comment_likes FOR DELETE TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.question_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;