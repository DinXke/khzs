import crypto from 'crypto';

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, 'salt_key_123', 100000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const hashOfInput = hashPassword(password);
  return hashOfInput === hash;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
