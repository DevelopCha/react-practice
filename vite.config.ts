import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: {
    __WORKSPACE_ROOT__: JSON.stringify(process.cwd().replace(/\\/g, '/')),
  },
  plugins: [react],
});
