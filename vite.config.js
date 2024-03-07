
import wasm from "vite-plugin-wasm";
// vite.config.js
export default {
  plugins: [wasm()],
  build: {
    target: "esnext"
  },
  server: {
    watch: {
      usePolling: true,
      interval: 500
    }
  }
}