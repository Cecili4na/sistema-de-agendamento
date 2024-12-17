import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [remix(), tsconfigPaths()],
  server: {
    port: 3000,
    host: 'localhost',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client'],
  },
});