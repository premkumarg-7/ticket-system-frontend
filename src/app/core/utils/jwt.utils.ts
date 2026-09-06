import { JwtPayload } from '../models/auth.models';

/**
 * Decodes a JWT token's payload without verifying the signature.
 * Verification happens server-side via the API Gateway.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  // exp is in seconds; Date.now() in ms
  return payload.exp * 1000 < Date.now();
}
