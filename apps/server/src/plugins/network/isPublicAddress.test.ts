import { describe, expect, it } from 'vitest';
import { isPublicAddress } from './isPublicAddress';

describe('whether a plugin may reach an address', () => {
  it.each(['93.184.216.34', '1.1.1.1', '2606:4700:4700::1111'])('allows %s', (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });

  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.20.0.1',
    '192.168.1.222',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fe80::1',
    'fd00::1',
    '::ffff:127.0.0.1',
    '::ffff:169.254.169.254',
    'not an address',
  ])('refuses %s', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
});
