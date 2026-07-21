import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import type { ResumeInsights } from "@/lib/insights";

export function ResumeInsightsCard({ insights }: { insights: ResumeInsights }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden /> Resume Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <ScoreRing label="Resume" value={insights.resumeScore} />
          <ScoreRing label="Profile" value={insights.profileStrength} />
          <ScoreRing label="Readiness" value={insights.hiringReadiness} />
        </div>

        {insights.strengths.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden /> Strengths
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.strengths.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {insights.missingSkills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden /> Suggested skills to add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.missingSkills.map((s) => (
                <Badge key={s} variant="outline" className="capitalize">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {insights.suggestions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-warning" aria-hidden /> Improvement suggestions
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              {insights.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreRing({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <Progress value={value} aria-label={`${label} score ${value} of 100`} />
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
