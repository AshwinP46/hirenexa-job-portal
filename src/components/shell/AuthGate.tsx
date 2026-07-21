import { useRequireRole } from "@/lib/api";
import type { AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function AuthGate({ roles, children }: { roles?: AppRole[]; children: ReactNode }) {
  const { loading, authorized } = useRequireRole(roles);
  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative h-12 w-12 animate-pulse">
          <img src="/logo-icon.png" alt="HireNexa" className="h-full w-full object-contain" />
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
