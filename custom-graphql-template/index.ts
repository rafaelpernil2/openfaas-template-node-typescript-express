import express from "express";
import ws from "ws";
import cors from "cors";

// import {  } from "express;

const bodyParser = require("body-parser");
const handle = require("./function/handler");
import { Request, Response, NextFunction } from "express-serve-static-core";

// require('dotenv').config();

// const {
//     MONGO_DB_ENDPOINT,
//     IS_HTTPS,
//     SSL_CRT_FILE,
//     SSL_KEY_FILE,
//     HTTPS_PORT
// } = EnvLoader.getInstance().loadedVariables;

// MONGODB Connection
// mongoose.connect(MONGO_DB_ENDPOINT, { useNewUrlParser: true, useUnifiedTopology: true });
// !mongoose.connection ? console.log("Error connecting to MongoDB") : console.log("MongoDB connected successfully");

// EXPRESS and GraphQL HTTP initialization

const app = express();
app.use(cors());
// expressServer.use(graphqlHTTP({ schema, graphiql: true }));

const defaultMaxSize = "100kb"; // body-parser default

app.disable("x-powered-by");

const rawLimit = process.env.MAX_RAW_SIZE || defaultMaxSize;
const jsonLimit = process.env.MAX_JSON_SIZE || defaultMaxSize;

app.use(function addDefaultContentType(req, res, next) {
  // When no content-type is given, the body element is set to
  // nil, and has been a source of contention for new users.

  if (!req.headers["content-type"]) {
    req.headers["content-type"] = "text/plain";
  }
  next();
});

if (process.env.RAW_BODY === "true") {
  app.use(bodyParser.raw({ type: "*/*", limit: rawLimit }));
} else {
  app.use(bodyParser.text({ type: "text/*" }));
  app.use(bodyParser.json({ limit: jsonLimit }));
  app.use(bodyParser.urlencoded({ extended: true }));
}

const isArray = (a) => {
  return !!a && a.constructor === Array;
};

const isObject = (a) => {
  return !!a && a.constructor === Object;
};

function getFunctionEvent({
  body,
  headers,
  method,
  query,
  path,
}): Record<string, unknown> {
  return { body, headers, method, query, path };
}

class FunctionContext {
  private statusCode: number;
  private cb: (err: unknown, functionResult?: unknown) => unknown;
  private headerValues: Record<string, unknown>;
  public cbCalled: number;
  constructor(cb) {
    this.statusCode = 200;
    this.cb = cb;
    this.headerValues = {};
    this.cbCalled = 0;
  }

  status(statusCode?: number) {
    if (!statusCode) {
      return this.statusCode;
    }
    this.statusCode = statusCode;
    return this;
  }

  headers(value?: Record<string, unknown>) {
    if (!value) {
      return this.headerValues;
    }
    this.headerValues = value;

    return this;
  }

  succeed(value) {
    let err;
    this.cbCalled++;
    this.cb(err, value);
  }

  fail(value) {
    let message;
    if (this.status() === 200) {
      this.status(500);
    }

    this.cbCalled++;
    this.cb(value, message);
  }
}

const middleware = async (req: Request, res: Response, next: NextFunction) => {
  const cb: (err: any, functionResult?: unknown) => unknown = (
    err,
    functionResult
  ) => {
    if (err) {
      console.error(err);

      return res
        .status(fnContext.status() as number)
        .send(err.toString ? err.toString() : err);
    }

    if (isArray(functionResult) || isObject(functionResult)) {
      res
        .set(fnContext.headers())
        .status(fnContext.status() as number)
        .send(JSON.stringify(functionResult));
    } else {
      res
        .set(fnContext.headers())
        .status(fnContext.status() as number)
        .send(functionResult);
    }
  };

  const fnEvent = getFunctionEvent(req);
  const fnContext = new FunctionContext(cb);

  Promise.resolve(handle(fnEvent, fnContext, cb))
    .then((res) => {
      if (!fnContext.cbCalled) {
        fnContext.succeed(res);
      }
    })
    .catch((e) => {
      cb(e);
    });
  console.log("Hace algo!");
};

app.post("/*", middleware);
app.get("/*", middleware);
app.patch("/*", middleware);
app.put("/*", middleware);
app.delete("/*", middleware);
app.options("/*", middleware);

const wssPath = "/subscriptions";

// HTTPS / WSS
const port = process.env.http_port || 3000;
const server = app.listen(port, () => {
  console.log(
    `GraphQL server running using ${
      Boolean(false) ? "HTTPS" : "HTTP"
    } on port ${port}`
  );

  const wsServer = new ws.Server({ server, path: wssPath });
  // useServer({ schema, execute, subscribe }, wsServer);
  console.log(
    `WebSockets server running ${
      Boolean(false) ? "using SSL" : "without SSL"
    } on port ${port} at ${wssPath}`
  );
});
