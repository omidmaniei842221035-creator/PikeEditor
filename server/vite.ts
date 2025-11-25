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
    // ESM
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  // CommonJS fallback
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

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

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
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    if (url.startsWith('/api')) {
      return next();
    }

    try {
      const currentDir = getCurrentDir();
      const clientTemplate = path.resolve(currentDir, "..", "client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
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
  console.log(`Current directory: ${currentDir}`);
  
  // Try multiple paths for Electron packaged app
  const possiblePaths = [
    path.resolve(currentDir, "public"),           // Same folder as index.cjs
    path.resolve(currentDir, "..", "public"),     // Parent folder
    path.join(process.cwd(), "dist", "public"),   // From working directory
    path.join(process.cwd(), "public"),           // Direct public folder
  ];
  
  let distPath: string | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      distPath = p;
      break;
    }
  }

  if (!distPath) {
    console.error(`Could not find static files. Tried paths:`);
    possiblePaths.forEach(p => console.error(`  - ${p} (exists: ${fs.existsSync(p)})`));
    throw new Error(`Could not find the build directory, make sure to build the client first`);
  }
  
  console.log(`Serving static files from: ${distPath}`);

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
