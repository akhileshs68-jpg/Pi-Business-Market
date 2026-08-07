import app from "../server.js";
import { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    req.url = `/api${url.startsWith('/') ? url : '/' + url}`;
  }
  return app(req, res);
}
