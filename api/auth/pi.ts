import app from "../../server.js";
import { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  req.url = "/api/auth/pi";
  return app(req, res);
}
