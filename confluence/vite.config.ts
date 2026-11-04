import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({ plugins: [react()], base: '/confluence/', build: { outDir: '../public/confluence', emptyOutDir: true } });
