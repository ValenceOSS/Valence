import { describe, expect, it } from 'vitest';
import { resolvesSafely } from './resolvesSafely';

const answering =
  (...addresses: string[]) =>
  () =>
    Promise.resolve(addresses.map((address) => ({ address })));

describe('resolvesSafely', () => {
  it('sends to a name that resolves to an ordinary address, on the network or off it', async () => {
    await expect(resolvesSafely('https://hooks.example.test/x', answering('93.184.216.34'))).resolves.toBe(true);
    await expect(resolvesSafely('http://homeassistant.local/x', answering('192.168.1.20'))).resolves.toBe(true);
  });

  it('refuses a name that resolves to the cloud’s metadata service', async () => {
    await expect(
      resolvesSafely('https://looks-harmless.example.test/x', answering('93.184.216.34', '169.254.169.254')),
    ).resolves.toBe(false);
    await expect(resolvesSafely('https://v6.example.test/x', answering('fe80::1'))).resolves.toBe(false);
  });

  it('refuses a name that resolves to nothing, or could not be looked up', async () => {
    await expect(resolvesSafely('https://gone.example.test/x', answering())).resolves.toBe(false);
    await expect(
      resolvesSafely('https://gone.example.test/x', () => Promise.reject(new Error('ENOTFOUND'))),
    ).resolves.toBe(false);
  });

  it('refuses what the address check refuses before looking anything up', async () => {
    await expect(resolvesSafely('ftp://example.test/x', answering('93.184.216.34'))).resolves.toBe(false);
    await expect(resolvesSafely('http://169.254.169.254/latest', answering('169.254.169.254'))).resolves.toBe(false);
  });
});
