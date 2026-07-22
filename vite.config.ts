import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      tailwindcss(),
      react(),
    ],
    resolve: {
      tsconfigPaths: true,
      dedupe: ["react", "react-dom"],
    },
  };
});
