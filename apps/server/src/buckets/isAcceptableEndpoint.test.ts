import { describe, expect, it } from 'vitest';
import { isAcceptableEndpoint } from './isAcceptableEndpoint';

const resolvesTo =
  (...addresses: string[]) =>
  () =>
    Promise.resolve(addresses);

describe('isAcceptableEndpoint', () => {
  it('takes none, which means the provider’s own', async () => {
    await expect(isAcceptableEndpoint('')).resolves.toBe(true);
  });

  it('takes a public service and one on the home network', async () => {
    await expect(
      isAcceptableEndpoint('https://s3.example.com', resolvesTo('93.184.216.34')),
    ).resolves.toBe(true);
    await expect(
      isAcceptableEndpoint('http://minio.home:9000', resolvesTo('192.168.1.20')),
    ).resolves.toBe(true);
    await expect(isAcceptableEndpoint('http://192.168.1.20:9000')).resolves.toBe(true);
  });

  it('refuses a cloud’s metadata address, written as a number or reached by a name', async () => {
    await expect(isAcceptableEndpoint('http://169.254.169.254/latest')).resolves.toBe(false);
    await expect(isAcceptableEndpoint('http://[fe80::1]/')).resolves.toBe(false);
    await expect(isAcceptableEndpoint('http://[::ffff:169.254.169.254]/')).resolves.toBe(false);
    await expect(
      isAcceptableEndpoint('http://metadata.example', resolvesTo('169.254.169.254')),
    ).resolves.toBe(false);
  });

  it('refuses an address that is not http or https', async () => {
    await expect(isAcceptableEndpoint('file:///etc/passwd')).resolves.toBe(false);
    await expect(isAcceptableEndpoint('not a url')).resolves.toBe(false);
  });
});
