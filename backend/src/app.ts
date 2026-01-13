import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import analyzeRoute from "./routes/analyze";
import healthRoute from "./routes/health";

export default async function app(fastify: FastifyInstance) {
  // Register CORS
  // Allow frontend (localhost:3000) to call backend (localhost:3001)
  // CORS misconfiguration causes "Failed to fetch" because browser blocks cross-origin requests
  // When frontend (localhost:3000) calls backend (localhost:3001), browser enforces CORS
  // If CORS headers are missing or incorrect, browser shows "Failed to fetch" error
  await fastify.register(cors, {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Register JSON body parsing (built-in to Fastify)
  // Fastify handles JSON parsing automatically

  // Register routes WITHOUT prefix (prefix is applied in server.ts)
  // Route paths: /health and /analyze
  // Final paths: /api/v1/health and /api/v1/analyze (prefix from server.ts)
  await fastify.register(healthRoute);
  await fastify.register(analyzeRoute);

  // Log route registration confirmation
  fastify.log.info("✅ Routes registered (prefix /api/v1 applied in server.ts):");
  fastify.log.info("   GET  /health -> /api/v1/health");
  fastify.log.info("   POST /analyze -> /api/v1/analyze");

  // Add 404 handler to debug routing issues
  fastify.setNotFoundHandler((request, reply) => {
    fastify.log.warn({
      method: request.method,
      url: request.url,
      path: request.routerPath,
    }, "404 - Route not found");
    
    reply.code(404).send({
      error_code: "NOT_FOUND",
      message: `Route ${request.method} ${request.url} not found`,
      available_routes: [
        "GET  /api/v1/health",
        "POST /api/v1/analyze",
      ],
      timestamp: new Date().toISOString(),
    });
  });

  fastify.log.info("Routes registered:");
  fastify.log.info("  GET  /api/v1/health");
  fastify.log.info("  POST /api/v1/analyze");
}

