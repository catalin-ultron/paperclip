import { NextRequest } from "next/server";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const header = req.headers.get("x-user-id");
  if (!header) return null;
  const id = parseInt(header, 10);
  if (Number.isNaN(id)) return null;
  return { id, email: "user@chronosos.local", name: "User" };
}
