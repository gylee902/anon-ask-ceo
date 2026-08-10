CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  is_published boolean NOT NULL DEFAULT true,
  is_open boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.events TO anon, authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_public_read ON public.events FOR SELECT TO anon, authenticated USING (is_published = true);

INSERT INTO public.events (slug, title, subtitle, is_published, is_open, sort_order)
VALUES ('2026', 'CEO 타운홀 미팅 사전 Q&A', '상시 접수', true, true, 100);

ALTER TABLE public.questions ADD COLUMN event_id uuid REFERENCES public.events(id) ON DELETE CASCADE;
UPDATE public.questions SET event_id = (SELECT id FROM public.events WHERE slug = '2026');
ALTER TABLE public.questions ALTER COLUMN event_id SET NOT NULL;
CREATE INDEX questions_event_id_idx ON public.questions(event_id);

DROP POLICY IF EXISTS questions_public_insert ON public.questions;
CREATE POLICY questions_public_insert ON public.questions FOR INSERT TO anon, authenticated
WITH CHECK (
  is_hidden = false
  AND is_answered = false
  AND char_length(title) >= 2 AND char_length(title) <= 4000
  AND (body IS NULL OR char_length(body) <= 8000)
  AND (nickname IS NULL OR char_length(nickname) <= 30)
  AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true AND e.is_open = true)
);

DROP POLICY IF EXISTS comments_public_insert ON public.comments;
CREATE POLICY comments_public_insert ON public.comments FOR INSERT TO anon, authenticated
WITH CHECK (
  is_hidden = false
  AND char_length(body) >= 1 AND char_length(body) <= 4000
  AND (nickname IS NULL OR char_length(nickname) <= 30)
);

ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.questions REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.question_likes REPLICA IDENTITY FULL;
ALTER TABLE public.comment_likes REPLICA IDENTITY FULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['events','questions','comments','question_likes','comment_likes'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;