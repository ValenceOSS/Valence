import { describe, expect, it } from 'vitest';
import { isPublicWebAddress } from '@ValenceServer/live/isPublicWebAddress';

const resolves =
  (...addresses: string[]) =>
  () =>
    Promise.resolve(addresses);

describe('isPublicWebAddress', () => {
  it('accepts a public number and a name that resolves publicly', async () => {
    await expect(isPublicWebAddress('http://93.184.216.34/a.ts')).resolves.toBe(true);
    await expect(
      isPublicWebAddress('https://cdn.example/a.ts', resolves('93.184.216.34')),
    ).resolves.toBe(true);
  });

  it('refuses private, loopback and metadata numbers', async () => {
    for (const address of [
      'http://169.254.169.254/latest',
      'http://127.0.0.1:8420/',
      'http://10.0.0.5/x',
      'http://[::1]/x',
    ]) {
      await expect(isPublicWebAddress(address)).resolves.toBe(false);
    }
  });

  it('refuses a name with any private address, and one that does not resolve', async () => {
    await expect(
      isPublicWebAddress('http://requests/x', resolves('93.184.216.34', '172.18.0.4')),
    ).resolves.toBe(false);
    await expect(
      isPublicWebAddress('http://nowhere/x', () => Promise.reject(new Error('x'))),
    ).resolves.toBe(false);
  });

  it('refuses anything that is not http or https', async () => {
    await expect(isPublicWebAddress('file:///etc/passwd')).resolves.toBe(false);
    await expect(isPublicWebAddress('data:text/html,hi')).resolves.toBe(false);
  });
});
