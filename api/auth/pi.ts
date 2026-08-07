import type { Request, Response } from 'express';
import axios from 'axios';

export default async function handler(req: Request, res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { accessToken } = req.body || {};
    if (!accessToken) {
      return res.status(400).json({ error: "Access token is required" });
    }

    if (accessToken === "mock_token_123" && process.env.VITE_DEVELOPMENT_MODE === 'true') {
      return res.json({
        success: true,
        user: {
          uid: "dev_mock_pioneer",
          username: "dev_mock_pioneer",
        },
      });
    } else if (accessToken === "mock_token_123") {
      return res.status(403).json({ error: "Mock token not allowed in production." });
    }

    // Validate with Pi Network API
    const response = await axios.get("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const piUser = response.data;

    return res.json({
      success: true,
      user: {
        uid: piUser.uid,
        username: piUser.username,
      },
    });
  } catch (error: any) {
    console.error("[Pi Auth Error] Failed to validate accessToken:", error.response?.data || error.message);
    return res.status(401).json({
      error: "Invalid or expired Pi accessToken",
      details: error.response?.data || error.message,
    });
  }
}
