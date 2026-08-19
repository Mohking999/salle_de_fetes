import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain Vite config — no more @lovable.dev/vite-tanstack-config wrapper.
// Defaults to Nitro's "node-server" preset (runs anywhere with `node .output/server/index.mjs`
// after `npm run build`). To deploy to Cloudflare Workers instead, change the preset below to
// "cloudflare-module" (src/server.ts's `fetch(request, env, ctx)` export already matches that
// format) and add the relevant wrangler config.
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
    nitro({ preset: "node-server" }),
  ],
  environments: {
    ssr: {
      build: {
        // src/server.ts wraps TanStack Start's server entry with our SSR error handling.
        rollupOptions: { input: "./src/server.ts" },
      },
    },
  },
});
