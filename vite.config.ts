import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: path.join(__dirname, "src") }],
    // To allow importing `.d.ts` files.
    extensions: [
      ".mjs",
      ".js",
      ".ts",
      ".mts",
      ".jsx",
      ".tsx",
      ".json",
      ".d.ts",
    ],
  },
  plugins: [vue()],
});
