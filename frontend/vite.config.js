import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // When VITE_USE_MOCK=false the frontend talks to the Express backend through this proxy
    proxy: { '/api': 'http://localhost:5000' },
  },
});
