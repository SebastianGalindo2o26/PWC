import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { POST } from './api/reservations.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['RESEND_API_KEY', 'RESERVATION_FROM_EMAIL', 'RESERVATION_TO_EMAIL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-reservation-api',
        configureServer(server) {
          server.middlewares.use('/api/reservations', async (req, res) => {
            try {
              const chunks = [];
              for await (const chunk of req) chunks.push(chunk);
              const request = new Request(`http://${req.headers.host || 'localhost'}/api/reservations`, {
                method: req.method,
                headers: req.headers,
                body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
              });
              const response = req.method === 'POST' ? await POST(request) : Response.json({ error: 'Método no permitido.' }, { status: 405 });
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(await response.text());
            } catch (error) {
              console.error('Local reservation API failed:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'No se pudo enviar la solicitud. Llámanos para reservar.' }));
            }
          });
        },
      },
    ],
  };
});
