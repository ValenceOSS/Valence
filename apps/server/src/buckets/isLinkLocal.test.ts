import { describe, expect, it } from 'vitest';
import { isLinkLocal } from './isLinkLocal';

describe('isLinkLocal', () => {
  it('knows the addresses a cloud keeps its metadata service on', () => {
    expect(isLinkLocal('169.254.169.254')).toBe(true);
    expect(isLinkLocal('fe80::1')).toBe(true);
    expect(isLinkLocal('fd00:ec2::254')).toBe(true);
    expect(isLinkLocal('::ffff:169.254.169.254')).toBe(true);
  });

  it('leaves public and home-network addresses alone', () => {
    expect(isLinkLocal('203.0.113.5')).toBe(false);
    expect(isLinkLocal('192.168.1.20')).toBe(false);
    expect(isLinkLocal('not an address')).toBe(false);
  });
});
