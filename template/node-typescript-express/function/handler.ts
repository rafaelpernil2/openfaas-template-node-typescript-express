import https from "https";
import * as http from "http";
import * as core from 'express-serve-static-core';

async function handle(event: any, context: any, cb: any) {
  const result = {
    body: JSON.stringify(event.body),
    "content-type": event.headers["content-type"],
  };
  return context.status(200).succeed(result);
}

function onExpressServerCreated(expressServer: core.Express) {
  // Add your code
  console.log("onExpressServerCreated", expressServer);
}

async function onExpressServerListen(server: https.Server | http.Server) {
  // Add your code
  console.log("onExpressServerListen", server);
}

export { handle, onExpressServerCreated, onExpressServerListen };
