import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabase";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.slice("Bearer ".length);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email ?? undefined;
    return next();
  } catch (err) {
    return next(err);
  }
}
