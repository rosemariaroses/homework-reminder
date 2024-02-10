import createBareServer from '@tomphttp/bare-server-node';
import { fileURLToPath } from "url";
import { createServer as createHttpsServer } from "node:https";
import { createServer as createHttpServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import express from "express";
import serveStatic from "serve-static";
import { hostname } from "node:os";
const bare = createBareServer("/bare/");
const serve = serveStatic(fileURLToPath(new URL("../static/", import.meta.url)), { fallthrough: false });
var server;
server = createHttpServer();
server.on("request", (req, res) => {
  if(bare.shouldRoute(req)) bare.routeRequest(req, res); else {
    serve(req, res, (err) => {
      res.writeHead(err?.statusCode || 500, null, {
        "Content-Type": "text/plain",
      });
      res.end('Error')
    })
  }
});

server.on("upgrade", (req, socket, head) => {
  if(bare.shouldRoute(req, socket, head)) bare.routeUpgrade(req, socket, head); else socket.end();
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
  const address = server.address();

  // by default we are listening on 0.0.0.0 (every interface)
  // we just need to list a few
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
  console.log(
    `\thttp://${
      address.family === "IPv6" ? `[${address.address}]` : address.address
    }:${address.port}`
  );
});

// https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

function shutdown() {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

server.listen({
  port,
});