import express from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "...";
      }
      console.log(logLine);
    }
  });

  next();
});

async function startServer() {
  const server = await registerRoutes(app);
  
  const resourcesPath = process.env.RESOURCES_PATH || '';
  console.log('[Electron Server] RESOURCES_PATH:', resourcesPath);
  console.log('[Electron Server] __dirname:', __dirname);
  console.log('[Electron Server] cwd:', process.cwd());
  
  const possiblePaths = [
    resourcesPath ? path.join(resourcesPath, 'public') : '',
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'resources', 'public'),
    path.join(__dirname, 'public'),
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', '..', 'public'),
    'dist-public',
  ].filter(p => p);
  
  console.log('[Electron Server] Checking paths:', possiblePaths);

  let staticPath = '';
  for (const p of possiblePaths) {
    const indexPath = path.join(p, 'index.html');
    if (fs.existsSync(indexPath)) {
      staticPath = p;
      console.log(`Found static files at: ${staticPath}`);
      break;
    }
  }

  if (!staticPath) {
    console.error('Could not find static files! Checked:', possiblePaths);
    staticPath = possiblePaths[0];
  }

  app.use(express.static(staticPath));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("index.html not found");
    }
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "127.0.0.1";
  console.log(`[Electron] Binding to ${host}:${port}`);
  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });
}

startServer().catch(console.error);
