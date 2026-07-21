const fs = require("fs");
const files = [
  "src/routes/jobs.tsx",
  "src/routes/applications.tsx",
  "src/routes/interviews.tsx",
  "src/routes/profile.tsx",
  "src/routes/recruiter.index.tsx",
  "src/routes/recruiter.jobs.tsx"
];
for (const f of files) {
  let text = fs.readFileSync(f, "utf8");
  const block = "  if (loading || !user) {\n    return (\n      <div className=\"min-h-screen flex items-center justify-center bg-background\">\n        <div className=\"flex items-center gap-2 text-muted-foreground\">\n          <Loader2 className=\"h-4 w-4 animate-spin\" />\n          <span className=\"text-sm\">Loading…</span>\n        </div>\n      </div>\n    );\n  }\n";
  
  if (text.includes(block)) {
    text = text.replace(block, "");
    const target = "  return (\n    <AppShell";
    if (text.includes(target)) {
      text = text.replace(target, block + "\n" + target);
      fs.writeFileSync(f, text);
      console.log("Fixed " + f);
    } else {
      console.log("Could not find AppShell in " + f);
    }
  } else {
    console.log("Could not find block in " + f);
  }
}

