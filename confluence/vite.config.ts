import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [react()], base: '/confluence/',
  build: {
    outDir: '../public/confluence', emptyOutDir: true,
    rollupOptions: {
      input: { main: 'index.html', embed: 'src/embed.tsx' },
      preserveEntrySignatures: 'strict',
      output: { entryFileNames: 'assets/[name].js' }
    }
  }
});
