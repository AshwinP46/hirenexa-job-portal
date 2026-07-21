import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export function SmartInsightsCard({ insights }: { insights: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden /> Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-xs text-muted-foreground">You're all caught up. Great work!</p>
        ) : (
          <ul className="space-y-2">
            {insights.map((tip, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-background/40 p-3 text-xs text-foreground/90"
              >
                {tip}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
