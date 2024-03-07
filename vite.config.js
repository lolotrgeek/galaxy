import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  server: {
    watch: {
      usePolling: true,
      interval: 500
    }
  }
});
