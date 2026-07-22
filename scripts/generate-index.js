// This script runs after 'npm run build' to generate index.html for static hosting
import { readdirSync, writeFileSync } from "fs";
import { join } from "path";

const clientDir = join(process.cwd(), "dist", "client", "assets");
const files = readdirSync(clientDir);

const cssFile = files.find((f) => f.endsWith(".css"));
const jsFile = files.find((f) => f.startsWith("index-") && f.endsWith(".js"));

if (!jsFile || !cssFile) {
  console.error("Could not find main JS or CSS bundle!", { jsFile, cssFile });
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>HireNexa – Smart Campus Recruitment</title>
    <meta name="description" content="Next-generation campus recruitment platform for students, recruiters, and admins with smart hiring and placement analytics." />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="stylesheet" crossorigin href="/assets/${cssFile}" />
    <script>
      window.__TSR__ = window.__TSR__ || { manifest: { routes: {} } };
    </script>
  </head>
  <body>
    <script type="module" crossorigin src="/assets/${jsFile}"></script>
  </body>
</html>`;

writeFileSync(join(process.cwd(), "dist", "client", "index.html"), html);
console.log(`✅ Generated index.html with ${jsFile} and ${cssFile}`);
