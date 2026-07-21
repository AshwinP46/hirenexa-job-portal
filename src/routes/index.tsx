import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, roleHome } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireNexa — Campus Placement System" },
      { name: "description", content: "Premium placement portal for students, recruiters, and admins." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (role) navigate({ to: roleHome(role) });
  }, [user, role, loading, navigate]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="relative h-12 w-12 animate-pulse">
        <img src="/logo-icon.png" alt="HireNexa" className="h-full w-full object-contain" />
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm">Routing you to your dashboard…</span>
      </div>
    </div>
  );
}
