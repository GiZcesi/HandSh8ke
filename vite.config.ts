// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  root: "front", // 👈 this tells Vite to use /front as the site root
  server: {
    open: true,
  },
});
