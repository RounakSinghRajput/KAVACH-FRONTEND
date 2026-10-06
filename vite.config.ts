import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Mock CAPTCHA endpoint
      '/api/captcha': {
        target: 'http://localhost:5173',
        bypass: (req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              data: {
                captchaId: 'TEST_CAPTCHA_ID',
                imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
              },
            })
          );
          return true;
        },
      },
      // Mock SignIn endpoint
      '/api/auth/login': {
        target: 'http://localhost:5173',
        bypass: (req, res) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              user: {
                id: 'test-user-123',
                roles: ['ROLE_ZONAL_ADMIN'],
              },
              token: 'mock-jwt-token',
            })
          );
          return true;
        },
      },
    },
  },
});