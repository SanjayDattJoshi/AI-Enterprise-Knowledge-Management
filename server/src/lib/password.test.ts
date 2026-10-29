// Unit tests for password hashing & verification

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('Password Utility', () => {
  it('hashes a password and verifies it successfully', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const isValid = await verifyPassword(hash, password);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword(hash, 'WrongPassword123!');
    expect(isInvalid).toBe(false);
  });

  it('handles invalid hash formats gracefully', async () => {
    const isValid = await verifyPassword('not-a-valid-argon2-hash', 'password123');
    expect(isValid).toBe(false);
  });
});
