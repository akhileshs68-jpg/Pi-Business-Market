import app from "../../server.js";
import { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  req.url = "/api/payments/complete";
  return app(req, res);
}
