CREATE TABLE public.authorized_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_no text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.authorized_employees TO service_role;
ALTER TABLE public.authorized_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.authorized_employees FOR ALL TO service_role USING (true) WITH CHECK (true);