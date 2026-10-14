import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain Vite config — no more @lovable.dev/vite-tanstack-config wrapper.
// Vercel sets VERCEL during builds, so Nitro emits its Vercel functions there;
// local web builds keep the portable node-server output.
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    // react's vite plugin must come after start's vite plugin
    viteReact(),
    nitro({ preset: process.env.VERCEL ? "vercel" : "node-server" }),
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
