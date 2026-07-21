import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Lock } from "lucide-react";
import type { Badge as BadgeT } from "@/lib/insights";

export function AchievementsCard({ badges }: { badges: BadgeT[] }) {
  const earned = badges.filter((b) => b.earned).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" aria-hidden /> Achievements
          </span>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {earned}/{badges.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-2 gap-2">
          {badges.map((b) => (
            <li
              key={b.id}
              className={[
                "rounded-xl border p-3 text-xs transition",
                b.earned
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/30 opacity-60",
              ].join(" ")}
              aria-label={`${b.label}${b.earned ? " (earned)" : " (locked)"}`}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {b.earned ? (
                  <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                )}
                <span className="truncate">{b.label}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                {b.description}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
