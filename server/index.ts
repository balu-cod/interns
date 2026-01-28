import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ✅ SIMPLE, SAFE CORS
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// ✅ JSON parsing
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: false }));

// ✅ API logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      console.log(
        `${req.method} ${path} ${res.statusCode} in ${Date.now() - start}ms`,
        capturedJsonResponse ?? ""
      );
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  // ✅ Error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
  });

  const port = Number(process.env.PORT || 5000);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });
})();
