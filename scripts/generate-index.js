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
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HireNexa — Modern Job Portal & Placement Platform</title>
    <meta name="description" content="HireNexa connects students with top recruiters. Find jobs, track applications, and manage placements — all in one modern platform." />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="stylesheet" crossorigin href="/assets/${cssFile}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" crossorigin src="/assets/${jsFile}"></script>
  </body>
</html>`;

writeFileSync(join(process.cwd(), "dist", "client", "index.html"), html);
console.log(`✅ Generated index.html with ${jsFile} and ${cssFile}`);
