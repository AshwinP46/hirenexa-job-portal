import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter '' loads all env variables (not just VITE_ ones)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Inject loaded env variables into process.env for local development
  Object.assign(process.env, env);

  return {
    plugins: [
      tailwindcss(),
      tanstackStart({
        server: {
          entry: "server",
          preset: "vercel",
        },
      }),
      react(),
    ],
    resolve: {
      tsconfigPaths: true,
      dedupe: ["react", "react-dom"],
    },
  };
});
