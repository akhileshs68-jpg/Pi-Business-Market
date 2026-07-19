import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        error: "Access token is required",
      });
    }

    const response = await axios.get("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return res.status(200).json({
      success: true,
      user: {
        uid: response.data.uid,
        username: response.data.username,
      },
    });
  } catch (err: any) {
    return res.status(401).json({
      error: "Pi authentication failed",
      details: err.response?.data || err.message,
    });
  }
}