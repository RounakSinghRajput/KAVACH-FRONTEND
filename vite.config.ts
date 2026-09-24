import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['echarts', 'echarts-for-react'],
  },
  build: {
    rollupOptions: {
      input: './index.html', // Helps SPA fallback
    },
    outDir: 'suraksha', // Replace with your desired folder name
  },
});
