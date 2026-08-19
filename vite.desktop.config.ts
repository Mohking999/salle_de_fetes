import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Desktop renderer: static files only.  Electron owns the local database and
// the renderer never requires a web server or internet connection.
export default defineConfig({
  plugins: [tsConfigPaths(), tailwindcss(), viteReact()],
  base: "./",
  build: {
    outDir: "build/renderer",
    emptyOutDir: true,
  },
});
