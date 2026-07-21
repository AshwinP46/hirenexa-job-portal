import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "student" | "recruiter";

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
}

export function useAuth(): AuthState & {
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  const loadRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("role", { ascending: true });
    if (!data || data.length === 0) return null;
    // admin > recruiter > student priority
    const roles = data.map((r) => r.role as AppRole);
    if (roles.includes("admin")) return "admin";
    if (roles.includes("recruiter")) return "recruiter";
    return "student";
  }, []);

  const hydrate = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setState({ user: null, session: null, role: null, loading: false });
        return;
      }
      const role = await loadRole(session.user.id);
      setState({ user: session.user, session, role, loading: false });
    },
    [loadRole],
  );

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer Supabase calls to avoid potential deadlocks
      setTimeout(() => {
        hydrate(session);
      }, 0);
    });
    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, role: null, loading: false });
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session);
  }, [hydrate]);

  return { ...state, signOut, refresh };
}

export function roleHome(role: AppRole | null): string {
  if (role === "admin") return "/admin";
  if (role === "recruiter") return "/recruiter";
  return "/student";
}
