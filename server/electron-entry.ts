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
  console.log('[Electron Server] === PATH DEBUG ===');
  console.log('[Electron Server] RESOURCES_PATH env:', resourcesPath);
  console.log('[Electron Server] __dirname:', __dirname);
  console.log('[Electron Server] process.cwd():', process.cwd());
  
  // List contents of resources path if exists
  if (resourcesPath && fs.existsSync(resourcesPath)) {
    try {
      const contents = fs.readdirSync(resourcesPath);
      console.log('[Electron Server] Resources contents:', contents.join(', '));
      
      // Check if public folder exists
      const publicDir = path.join(resourcesPath, 'public');
      if (fs.existsSync(publicDir)) {
        const publicContents = fs.readdirSync(publicDir);
        console.log('[Electron Server] Public folder contents:', publicContents.join(', '));
      } else {
        console.log('[Electron Server] Public folder NOT FOUND at:', publicDir);
      }
    } catch (e) {
      console.log('[Electron Server] Error reading resources:', e);
    }
  } else {
    console.log('[Electron Server] Resources path does not exist or is empty');
  }
  
  const possiblePaths = [
    resourcesPath ? path.join(resourcesPath, 'public') : '',
    path.join(process.cwd(), 'public'),
    path.join(__dirname, '..', 'public'),
    'dist-public',
  ].filter(p => p);
  
  console.log('[Electron Server] Will check these paths:');
  possiblePaths.forEach((p, i) => {
    const indexPath = path.join(p, 'index.html');
    const exists = fs.existsSync(indexPath);
    console.log(`  [${i}] ${p} => index.html exists: ${exists}`);
  });

  let staticPath = '';
  for (const p of possiblePaths) {
    const indexPath = path.join(p, 'index.html');
    if (fs.existsSync(indexPath)) {
      staticPath = p;
      console.log(`[Electron Server] ✅ Found static files at: ${staticPath}`);
      break;
    }
  }

  if (!staticPath) {
    console.error('[Electron Server] ❌ Could not find static files!');
    staticPath = possiblePaths[0] || path.join(process.cwd(), 'public');
    console.log('[Electron Server] Using fallback path:', staticPath);
  }

  app.use(express.static(staticPath));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });
  
  app.get("/debug-paths", (_req, res) => {
    const debugInfo: any = {
      resourcesPath,
      staticPath,
      __dirname,
      cwd: process.cwd(),
      resourcesContents: [],
      publicContents: [],
    };
    
    try {
      if (resourcesPath && fs.existsSync(resourcesPath)) {
        debugInfo.resourcesContents = fs.readdirSync(resourcesPath);
        const publicDir = path.join(resourcesPath, 'public');
        if (fs.existsSync(publicDir)) {
          debugInfo.publicContents = fs.readdirSync(publicDir);
        } else {
          debugInfo.publicError = 'public folder does not exist';
        }
      }
    } catch (e: any) {
      debugInfo.error = e.message;
    }
    
    res.json(debugInfo);
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
