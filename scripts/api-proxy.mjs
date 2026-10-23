/**
 * Proxy local para probar la app web sin problemas de CORS.
 *
 * El backend solo permite el origen https://caramelo-web.onrender.com, asi que
 * el navegador bloquea las llamadas desde http://localhost:8081. Este proxy
 * reenvia las peticiones a la API y agrega los headers CORS necesarios.
 *
 * Uso: node scripts/api-proxy.mjs
 * Variables opcionales: API_PROXY_TARGET, API_PROXY_PORT, API_PROXY_HOST
 */
import http from "node:http";
import https from "node:https";

const target = new URL(process.env.API_PROXY_TARGET ?? "https://caramelo-api-tijm.onrender.com");
const port = Number(process.env.API_PROXY_PORT ?? 3002);
const host = process.env.API_PROXY_HOST ?? "127.0.0.1";

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", target);

  if (!url.pathname.startsWith("/api/")) {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "El proxy solo reenvia rutas /api/*" }));
    return;
  }

  const transport = url.protocol === "https:" ? https : http;
  const proxyReq = transport.request(
    {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method: req.method,
      headers: {
        ...req.headers,
        host: url.host,
        origin: target.origin,
      },
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers };

      // Se descartan los CORS del backend y se usa el del proxy.
      for (const key of Object.keys(headers)) {
        if (key.toLowerCase().startsWith("access-control-")) delete headers[key];
      }
      headers["access-control-allow-origin"] = "*";

      res.writeHead(proxyRes.statusCode ?? 502, headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (error) => {
    if (res.headersSent) {
      res.destroy();
      return;
    }

    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: `No se pudo conectar con la API: ${error.message}` }));
  });

  req.pipe(proxyReq);
});

server.listen(port, host, () => {
  console.log(`Proxy de la API: http://${host}:${port}/api -> ${target.origin}`);
});
