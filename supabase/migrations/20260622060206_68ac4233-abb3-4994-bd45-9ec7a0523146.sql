
-- saved_jobs
CREATE TABLE public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, job_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own saved jobs" ON public.saved_jobs
  FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Students insert own saved jobs" ON public.saved_jobs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students delete own saved jobs" ON public.saved_jobs
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE INDEX idx_saved_jobs_student ON public.saved_jobs(student_id);
CREATE INDEX idx_saved_jobs_job ON public.saved_jobs(job_id);

-- audit_logs
CREATE TYPE public.audit_action AS ENUM (
  'job_created','job_updated','job_deleted','job_archived',
  'interview_scheduled','interview_rescheduled','interview_cancelled',
  'application_status_changed','application_created'
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
