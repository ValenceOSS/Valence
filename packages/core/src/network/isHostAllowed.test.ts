import { describe, expect, it } from 'vitest';
import { isHostAllowed } from './isHostAllowed';

describe('whether a host is one of those listed', () => {
  it('lets in a host written out in full, whatever its case', () => {
    expect(isHostAllowed('API.example.com', ['api.example.com'])).toBe(true);
    expect(isHostAllowed('api.example.com.', ['api.example.com'])).toBe(true);
  });

  it('keeps out a host that only ends the same way', () => {
    expect(isHostAllowed('evil-api.example.com', ['api.example.com'])).toBe(false);
  });

  it('lets in every host under a pattern, at any depth', () => {
    expect(isHostAllowed('eu1.files.example.com', ['*.files.example.com'])).toBe(true);
    expect(isHostAllowed('a.b.files.example.com', ['*.files.example.com'])).toBe(true);
  });

  it('keeps the name a pattern is under, and names that merely end like it, out', () => {
    expect(isHostAllowed('files.example.com', ['*.files.example.com'])).toBe(false);
    expect(isHostAllowed('evilfiles.example.com', ['*.files.example.com'])).toBe(false);
  });

  it('lets in nothing when nothing is listed', () => {
    expect(isHostAllowed('api.example.com', [])).toBe(false);
  });
});
