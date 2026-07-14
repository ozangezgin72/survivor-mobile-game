import { defineConfig } from 'vite';

export default defineConfig({
  // "npm run dev -- --host" ile aynı Wi-Fi ağındaki bir telefondan da test edilebilsin diye
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
