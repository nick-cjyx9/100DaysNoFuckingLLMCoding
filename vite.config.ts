import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

const days: Record<string, string> = {};

for (const dir of readdirSync(__dirname)) {
  if (dir.startsWith("day")) {
    days[dir] = resolve(__dirname, `${dir}/index.html`);
  }
}

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ...days,
      },
    },
  },
});
