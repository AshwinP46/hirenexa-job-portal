// Match score: 60% skills, 25% CGPA, 15% department.
export function computeMatch(opts: {
  studentSkills: string[];
  studentCgpa: number | null;
  studentDept: string | null;
  jobSkills: string[];
  jobMinCgpa: number | null;
  jobLocation?: string | null;
  jobTitle?: string | null;
}): number {
  const ss = new Set(opts.studentSkills.map((s) => s.toLowerCase().trim()));
  const js = opts.jobSkills.map((s) => s.toLowerCase().trim());
  const skillsPct = js.length === 0 ? 0.8 : js.filter((s) => ss.has(s)).length / js.length;

  const cgpa = opts.studentCgpa ?? 0;
  const need = opts.jobMinCgpa ?? 0;
  let cgpaPct = 0;
  if (need <= 0) cgpaPct = cgpa > 0 ? 0.85 : 0.5;
  else if (cgpa >= need) cgpaPct = Math.min(1, 0.7 + (cgpa - need) * 0.1);
  else cgpaPct = Math.max(0, cgpa / need * 0.6);

  const dept = (opts.studentDept ?? "").toLowerCase();
  const title = (opts.jobTitle ?? "").toLowerCase();
  // crude: if dept token appears in title/skills consider match
  const deptPct = dept && (title.includes(dept) || js.some((s) => s.includes(dept))) ? 1 : dept ? 0.5 : 0.4;

  const score = skillsPct * 0.6 + cgpaPct * 0.25 + deptPct * 0.15;
  return Math.round(score * 100);
}

export function isEligible(studentCgpa: number | null, jobMinCgpa: number | null): boolean {
  if (!jobMinCgpa || jobMinCgpa <= 0) return true;
  return (studentCgpa ?? 0) >= jobMinCgpa;
}
