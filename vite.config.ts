import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Change this to '/your-repo-name/' for GitHub Pages
  // e.g. if your repo is 'bug-hunt', change to '/bug-hunt/'
  base: './', 
});