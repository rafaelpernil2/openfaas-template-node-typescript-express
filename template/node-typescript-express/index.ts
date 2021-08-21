import express from "express";
import { Request, Response, NextFunction } from "express-serve-static-core";
const bodyParser = require("body-parser");
// @ts-ignore
import { handle, onExpressServerCreated, onExpressServerListen } from "./function/handler";
require('dotenv').config({ path:"./function/.env" });

const app = express();

// Express server created. Do any initialization required in the handler
onExpressServerCreated(app);

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
};

app.post("/*", middleware);
app.get("/*", middleware);
app.patch("/*", middleware);
app.put("/*", middleware);
app.delete("/*", middleware);
app.options("/*", middleware);

const port = process.env.http_port || 3000;
const server = app.listen(port, () => onExpressServerListen(server));
