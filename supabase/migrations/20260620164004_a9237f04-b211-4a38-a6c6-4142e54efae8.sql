
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'recruiter');
CREATE TYPE public.application_status AS ENUM ('applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected');
CREATE TYPE public.interview_mode AS ENUM ('online', 'onsite');
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security-definer (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'recruiter' THEN 2 ELSE 3 END
  LIMIT 1
$$;

-- =========================
-- STUDENTS
-- =========================
CREATE TABLE public.students (
  id UUID PRIMARY KEY,
  department TEXT,
  cgpa NUMERIC(3,2),
  year_of_study INT,
  roll_number TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  resume_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- =========================
-- RECRUITERS
-- =========================
CREATE TABLE public.recruiters (
  id UUID PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT '',
  recruiter_name TEXT NOT NULL DEFAULT '',
  company_logo TEXT,
  industry TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recruiters TO authenticated;
GRANT ALL ON public.recruiters TO service_role;
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- =========================
-- JOBS
-- =========================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT,
  package_lpa NUMERIC(5,2),
  minimum_cgpa NUMERIC(3,2) DEFAULT 0,
  job_type TEXT DEFAULT 'Full-time',
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  openings INT NOT NULL DEFAULT 1,
  deadline DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_recruiter ON public.jobs(recruiter_id);
CREATE INDEX idx_jobs_active ON public.jobs(is_active);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- =========================
-- APPLICATIONS
-- =========================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'applied',
  match_score INT,
  notes TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, job_id)
);
CREATE INDEX idx_applications_student ON public.applications(student_id);
CREATE INDEX idx_applications_job ON public.applications(job_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- =========================
-- INTERVIEWS
-- =========================
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  interview_date TIMESTAMPTZ NOT NULL,
  mode public.interview_mode NOT NULL DEFAULT 'online',
  round_name TEXT,
  location TEXT,
  meeting_link TEXT,
  feedback TEXT,
  status public.interview_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_interviews_application ON public.interviews(application_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================
-- updated_at TRIGGER
-- =========================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated     BEFORE UPDATE ON public.profiles     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_students_updated     BEFORE UPDATE ON public.students     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_recruiters_updated   BEFORE UPDATE ON public.recruiters   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_jobs_updated         BEFORE UPDATE ON public.jobs         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_interviews_updated   BEFORE UPDATE ON public.interviews   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- handle_new_user TRIGGER (signup)
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role public.app_role;
  _name TEXT;
BEGIN
  _name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');

  INSERT INTO public.profiles (id, name, email, phone)
  VALUES (NEW.id, _name, NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
  ON CONFLICT DO NOTHING;

  IF _role = 'student' THEN
    INSERT INTO public.students (id, department, cgpa)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'department', NULLIF(NEW.raw_user_meta_data->>'cgpa','')::numeric)
    ON CONFLICT (id) DO NOTHING;
  ELSIF _role = 'recruiter' THEN
    INSERT INTO public.recruiters (id, company_name, recruiter_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'company_name',''), _name)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- RLS POLICIES
-- =========================

-- profiles: each user can read/update own; everyone authenticated can read others (directory); admin all
CREATE POLICY "profiles_self_select"  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_self_update"  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_insert"  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all"    ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles: user reads own; admin all
CREATE POLICY "roles_self_select"  ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- students: self read/update; recruiters and admin read; admin write
CREATE POLICY "students_self_select"      ON public.students FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'recruiter') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "students_self_insert"      ON public.students FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "students_self_update"      ON public.students FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "students_admin_delete"     ON public.students FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- recruiters: self read/update; students+admin read; admin write
CREATE POLICY "recruiters_select"     ON public.recruiters FOR SELECT TO authenticated USING (true);
CREATE POLICY "recruiters_self_insert" ON public.recruiters FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "recruiters_self_update" ON public.recruiters FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "recruiters_admin_delete" ON public.recruiters FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- jobs: any authenticated reads; recruiter inserts own; recruiter/admin updates+deletes own
CREATE POLICY "jobs_select"          ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jobs_recruiter_insert" ON public.jobs FOR INSERT TO authenticated WITH CHECK (recruiter_id = auth.uid() AND public.has_role(auth.uid(),'recruiter'));
CREATE POLICY "jobs_recruiter_update" ON public.jobs FOR UPDATE TO authenticated USING (recruiter_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (recruiter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "jobs_recruiter_delete" ON public.jobs FOR DELETE TO authenticated USING (recruiter_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- applications: student sees own; recruiter sees apps for their jobs; admin all
CREATE POLICY "applications_select" ON public.applications FOR SELECT TO authenticated USING (
  student_id = auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.recruiter_id = auth.uid())
);
CREATE POLICY "applications_student_insert" ON public.applications FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND public.has_role(auth.uid(),'student'));
CREATE POLICY "applications_update" ON public.applications FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.recruiter_id = auth.uid())
) WITH CHECK (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.recruiter_id = auth.uid())
);
CREATE POLICY "applications_delete" ON public.applications FOR DELETE TO authenticated USING (student_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- interviews: student of the application; recruiter of the job; admin
CREATE POLICY "interviews_select" ON public.interviews FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE a.id = application_id AND (a.student_id = auth.uid() OR j.recruiter_id = auth.uid())
  )
);
CREATE POLICY "interviews_write" ON public.interviews FOR ALL TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id WHERE a.id = application_id AND j.recruiter_id = auth.uid())
) WITH CHECK (
  public.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.applications a JOIN public.jobs j ON j.id = a.job_id WHERE a.id = application_id AND j.recruiter_id = auth.uid())
);

-- notifications: user sees own; admin all
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================
-- STORAGE POLICIES (resumes bucket created via tool)
-- =========================
CREATE POLICY "resumes_student_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'resumes' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'recruiter')
  )
);
CREATE POLICY "resumes_student_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "resumes_student_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "resumes_student_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
