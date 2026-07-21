
-- Private schema for role helpers
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.get_primary_role(_user_id uuid)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'recruiter' THEN 2 ELSE 3 END
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.get_primary_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_primary_role(uuid) TO authenticated, service_role;

-- Drop policies referencing public helpers
DROP POLICY IF EXISTS "applications_student_insert" ON public.applications;
DROP POLICY IF EXISTS "applications_update" ON public.applications;
DROP POLICY IF EXISTS "applications_delete" ON public.applications;
DROP POLICY IF EXISTS "applications_select" ON public.applications;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "interviews_select" ON public.interviews;
DROP POLICY IF EXISTS "interviews_write" ON public.interviews;
DROP POLICY IF EXISTS "jobs_recruiter_insert" ON public.jobs;
DROP POLICY IF EXISTS "jobs_recruiter_update" ON public.jobs;
DROP POLICY IF EXISTS "jobs_recruiter_delete" ON public.jobs;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "recruiters_admin_delete" ON public.recruiters;
DROP POLICY IF EXISTS "recruiters_self_update" ON public.recruiters;
DROP POLICY IF EXISTS "students_self_update" ON public.students;
DROP POLICY IF EXISTS "students_admin_delete" ON public.students;
DROP POLICY IF EXISTS "students_self_select" ON public.students;
DROP POLICY IF EXISTS "students_self_insert" ON public.students;
DROP POLICY IF EXISTS "roles_admin_write" ON public.user_roles;
DROP POLICY IF EXISTS "roles_self_select" ON public.user_roles;
DROP POLICY IF EXISTS "resumes_student_read" ON storage.objects;

-- APPLICATIONS
CREATE POLICY "applications_select" ON public.applications FOR SELECT TO authenticated USING (
  student_id = auth.uid()
  OR private.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id AND j.recruiter_id = auth.uid())
);
CREATE POLICY "applications_student_insert" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND private.has_role(auth.uid(),'student'));
CREATE POLICY "applications_update" ON public.applications FOR UPDATE TO authenticated USING (
  private.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id AND j.recruiter_id = auth.uid())
) WITH CHECK (
  private.has_role(auth.uid(),'admin')
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = applications.job_id AND j.recruiter_id = auth.uid())
);
CREATE POLICY "applications_delete" ON public.applications FOR DELETE TO authenticated
  USING (student_id = auth.uid() OR private.has_role(auth.uid(),'admin'));

-- AUDIT LOGS
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action public.audit_action,
  _entity_type text,
  _entity_id uuid,
  _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), _action, _entity_type, _entity_id, COALESCE(_metadata,'{}'::jsonb))
  RETURNING id INTO _id;
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.log_audit_event(public.audit_action, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(public.audit_action, text, uuid, jsonb) TO authenticated;

-- INTERVIEWS
CREATE POLICY "interviews_select" ON public.interviews FOR SELECT TO authenticated USING (
  private.has_role(auth.uid(),'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.id = interviews.application_id
      AND (a.student_id = auth.uid() OR j.recruiter_id = auth.uid())
  )
);
CREATE POLICY "interviews_write" ON public.interviews FOR ALL TO authenticated USING (
  private.has_role(auth.uid(),'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.id = interviews.application_id AND j.recruiter_id = auth.uid()
  )
) WITH CHECK (
  private.has_role(auth.uid(),'admin')
  OR EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.id = interviews.application_id AND j.recruiter_id = auth.uid()
  )
);

-- JOBS
CREATE POLICY "jobs_recruiter_insert" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (recruiter_id = auth.uid() AND private.has_role(auth.uid(),'recruiter'));
CREATE POLICY "jobs_recruiter_update" ON public.jobs FOR UPDATE TO authenticated
  USING (recruiter_id = auth.uid() OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (recruiter_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "jobs_recruiter_delete" ON public.jobs FOR DELETE TO authenticated
  USING (recruiter_id = auth.uid() OR private.has_role(auth.uid(),'admin'));

-- NOTIFICATIONS
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR private.has_role(auth.uid(),'admin')
    OR (
      private.has_role(auth.uid(),'recruiter') AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE j.recruiter_id = auth.uid() AND a.student_id = notifications.user_id
      )
    )
  );

-- PROFILES
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid()
  OR private.has_role(auth.uid(),'admin')
  OR (
    private.has_role(auth.uid(),'recruiter') AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE j.recruiter_id = auth.uid() AND a.student_id = profiles.id
    )
  )
);

-- RECRUITERS
CREATE POLICY "recruiters_self_update" ON public.recruiters FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "recruiters_admin_delete" ON public.recruiters FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'admin'));

-- STUDENTS
CREATE POLICY "students_self_insert" ON public.students FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "students_self_update" ON public.students FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "students_admin_delete" ON public.students FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'admin'));
CREATE POLICY "students_self_select" ON public.students FOR SELECT TO authenticated USING (
  id = auth.uid()
  OR private.has_role(auth.uid(),'admin')
  OR (
    private.has_role(auth.uid(),'recruiter') AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE j.recruiter_id = auth.uid() AND a.student_id = students.id
    )
  )
);

-- USER ROLES
CREATE POLICY "roles_self_select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'))
  WITH CHECK (private.has_role(auth.uid(),'admin'));

-- STORAGE: tighten recruiter resume access to applicants only
CREATE POLICY "resumes_student_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'resumes' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR private.has_role(auth.uid(),'admin')
    OR (
      private.has_role(auth.uid(),'recruiter') AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE j.recruiter_id = auth.uid()
          AND (a.student_id)::text = (storage.foldername(name))[1]
      )
    )
  )
);

-- Drop the public helpers so they are no longer callable as RPC
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.get_primary_role(uuid);
