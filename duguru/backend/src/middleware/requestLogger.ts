import type { Request, Response, NextFunction } from "express";

/**
 * requestLogger — Log estruturado (JSON) de requests.
 *
 * Campos: timestamp, method, path, status, latency_ms, ip
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const latency = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latency_ms: latency,
      ip: req.ip ?? "unknown",
    };

    if (res.statusCode >= 500) {
      console.error(JSON.stringify(log));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify(log));
    } else {
      console.log(JSON.stringify(log));
    }
  });

  next();
}
