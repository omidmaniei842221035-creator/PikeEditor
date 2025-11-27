import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";
import { nanoid } from "nanoid";

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_PATH;

// Cross-compatible __dirname for both ESM and CommonJS
const getCurrentDir = () => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  return typeof __dirname !== 'undefined' ? __dirname : process.cwd();
};

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  if (isProduction) {
    console.log("Production mode: Vite setup skipped");
    return;
  }

  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteConfig = (await import("../vite.config")).default;
  const viteLogger = createLogger();

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: string, options?: any) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith('/api')) return next();

    try {
      const currentDir = getCurrentDir();
      const clientTemplate = path.resolve(currentDir, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const currentDir = getCurrentDir();
  const isElectron = !!process.env.DATABASE_PATH;
  const cwd = process.cwd();
  
  console.log(`[Static] Current directory: ${currentDir}`);
  console.log(`[Static] CWD: ${cwd}`);
  console.log(`[Static] Is Electron: ${isElectron}`);
  
  // For Electron: static files are in resources/public/ (extraResources)
  // For dev/web: static files are in dist-public/
  const possiblePaths = [
    // Electron packaged app paths (cwd is resources/)
    path.join(cwd, 'public'),                        // resources/public
    path.join(currentDir, '..', 'public'),           // resources/server/../public = resources/public
    // Development/Web paths
    path.join(cwd, 'dist-public'),
    path.join(process.cwd(), 'dist-public'),
    path.resolve('dist-public'),
  ];
  
  console.log('[Static] Checking paths:');
  let distPath: string | null = null;
  for (const p of possiblePaths) {
    const exists = fs.existsSync(p);
    const hasIndex = exists && fs.existsSync(path.join(p, 'index.html'));
    console.log(`  - ${p}: ${exists ? (hasIndex ? 'FOUND+index' : 'FOUND-noindex') : 'not found'}`);
    if (hasIndex && !distPath) {
      distPath = p;
    }
  }

  if (!distPath) {
    console.error('[Static] ERROR: Static files not found!');
    console.error('[Static] Checked paths:', possiblePaths);
    throw new Error(`Static files not found. Checked: ${possiblePaths.join(', ')}`);
  }
  
  console.log(`[Static] Serving from: ${distPath}`);
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
