import { SignJWT, jwtVerify } from 'jose';

// Simple signed token handling using Jose (perfect for Edge Middleware in Vercel)
const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'super_secret_admin_jwt_key_of_arien_bank_2026');

export async function signJWT(payload: any): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}
