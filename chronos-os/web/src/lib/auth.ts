import { headers } from "next/headers";

export async function getCurrentUserId(): Promise<string> {
  const h = await headers();
  return h.get("x-user-id") || "anonymous";
}
