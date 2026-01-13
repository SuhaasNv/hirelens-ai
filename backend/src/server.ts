import Fastify from "fastify";
import app from "./app";

const server = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
});

async function start() {
  try {
    // Add global onRequest hook BEFORE route registration to catch ALL requests
    // This logs every request at the root level to debug routing issues
    server.addHook("onRequest", async (request, reply) => {
      server.log.info({
        method: request.method,
        url: request.url,
        routerPath: request.routerPath,
        headers: {
          origin: request.headers.origin,
          "content-type": request.headers["content-type"],
          "user-agent": request.headers["user-agent"]?.substring(0, 50),
        },
      }, "🔍 [GLOBAL] Incoming request");
    });

    // Register the app routes and plugins
    // Prefix is applied here - routes inside app.ts will be under /api/v1
    await server.register(app, { prefix: "/api/v1" });

    // Start the server
    const port = 3001;
    await server.listen({ port, host: "0.0.0.0" });

    // Print all registered routes after server starts
    console.log("\n📋 Registered Routes:");
    server.printRoutes();

    // Log final resolved routes explicitly
    console.log("\n✅ Final Resolved Routes:");
    console.log("   GET  /api/v1/health");
    console.log("   POST /api/v1/analyze");

    console.log(`\n🚀 HireLens AI Backend started successfully`);
    console.log(`📡 Server listening on http://localhost:${port}`);
    console.log(`📋 API Base URL: http://localhost:${port}/api/v1`);
    console.log(`🏥 Health Check: http://localhost:${port}/api/v1/health`);
    console.log(`📊 Analyze Endpoint: http://localhost:${port}/api/v1/analyze`);
    console.log(`\n💡 To test: curl http://localhost:${port}/api/v1/health\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

