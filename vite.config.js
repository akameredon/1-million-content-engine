import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import generateHandler from './api/generate.js';

function localApi() {
  const mount = (middlewares) => {
    middlewares.use('/api/generate', (req, res, next) => {
      Promise.resolve(generateHandler(req, res)).catch(next);
    });
  };
  return {
    name: 'local-gemini-api',
    configureServer(server) { mount(server.middlewares); },
    configurePreviewServer(server) { mount(server.middlewares); },
  };
}

export default defineConfig({ plugins: [react(), localApi()] });