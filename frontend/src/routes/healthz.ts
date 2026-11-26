import { createFileRoute } from '@tanstack/react-router'

// Endpoint health untuk HEALTHCHECK container. Sengaja di luar prefix /api
// karena /api diteruskan reverse proxy ke backend Flask.
export const Route = createFileRoute('/healthz')({
  server: {
    handlers: {
      GET: () => new Response('ok', { status: 200 }),
    },
  },
})
