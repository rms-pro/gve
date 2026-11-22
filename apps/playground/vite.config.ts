import { defineConfig } from 'vite';
import { inputs, portal } from './portal/site';

export default defineConfig({
  base: './',
  esbuild: { jsx: 'automatic' },
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { rollupOptions: { input: inputs } },
  plugins: [portal(process.env.GVE_SITE_URL)],
});
