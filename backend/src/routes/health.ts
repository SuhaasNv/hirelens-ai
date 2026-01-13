import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export default async function healthRoute(fastify: FastifyInstance) {
  // Log route registration
  // Route path is relative: /health
  // Prefix /api/v1 is applied in server.ts when registering app plugin
  // Final route: GET /api/v1/health
  fastify.log.info("📝 Registering GET /health (relative path, prefix applied upstream)");

  fastify.get(
    "/health",
    async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        status: "operational",
        service: "HireLens AI Backend",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    }
  );
}

