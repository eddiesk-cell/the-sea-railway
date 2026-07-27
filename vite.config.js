import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run dev`   — live, hot-reloading
// `npm run build` — one self-contained .html in dist/ that opens by double-click
export default defineConfig({
  base: './',
  server: { port: Number(process.env.PORT) || 5183, host: true, strictPort: false },
  plugins: [viteSingleFile()],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
