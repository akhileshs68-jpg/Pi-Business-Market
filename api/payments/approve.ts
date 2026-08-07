import app from "../../server";
import { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  req.url = "/api/payments/approve";
  return app(req, res);
}
