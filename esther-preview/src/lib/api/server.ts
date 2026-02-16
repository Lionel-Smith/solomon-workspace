/**
 * Server-side API helpers — read cookies from the incoming request
 * and forward them to the cloud API.  Only import this in Server Components.
 */

import { cookies } from "next/headers";
import { config } from "@/lib/config";

/** Build headers object that forwards the auth cookie to the cloud API. */
export async function serverHeaders(): Promise<Record<string, string>> {
  const jar = await cookies();
  const token = jar.get(config.authCookieName);
  if (!token?.value) return {};
  return { Cookie: `${config.authCookieName}=${token.value}` };
}
