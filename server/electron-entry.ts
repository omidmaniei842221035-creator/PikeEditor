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
  console.log('[Server] RESOURCES_PATH:', resourcesPath);
  console.log('[Server] __dirname:', __dirname);
  console.log('[Server] cwd:', process.cwd());
  
  // List resources folder contents
  if (resourcesPath && fs.existsSync(resourcesPath)) {
    try {
      console.log('[Server] Resources contents:', fs.readdirSync(resourcesPath).join(', '));
    } catch (e) {}
  }
  
  const possiblePaths = [
    resourcesPath ? path.join(resourcesPath, 'public') : '',
    path.join(process.cwd(), 'public'),
    path.join(__dirname, '..', 'public'),
  ].filter(p => p);

  let staticPath = '';
  for (const p of possiblePaths) {
    const indexPath = path.join(p, 'index.html');
    console.log('[Server] Checking:', indexPath, '- exists:', fs.existsSync(indexPath));
    if (fs.existsSync(indexPath)) {
      staticPath = p;
      break;
    }
  }

  if (!staticPath) {
    console.error('[Server] Static files not found!');
    staticPath = possiblePaths[0] || path.join(process.cwd(), 'public');
  }
  
  console.log('[Server] Using static path:', staticPath);

  app.use(express.static(staticPath));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("*", (_req, res) => {
    const indexPath = path.join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("index.html not found at: " + indexPath);
    }
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "127.0.0.1";
  console.log(`[Server] Starting on ${host}:${port}`);
  server.listen(port, host, () => {
    console.log(`[Server] Running at http://${host}:${port}`);
  });
}

startServer().catch(console.error);
