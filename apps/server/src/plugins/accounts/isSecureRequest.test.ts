import { describe, expect, it } from 'vitest';
import { isSecureRequest } from './isSecureRequest';

describe('isSecureRequest', () => {
  it('is secure over HTTPS', () => {
    expect(isSecureRequest('https://valence.home/api', undefined)).toBe(true);
  });

  it('believes the first protocol a proxy names', () => {
    expect(isSecureRequest('http://10.0.0.2:8420/api', 'https')).toBe(true);
    expect(isSecureRequest('http://10.0.0.2:8420/api', 'https, http')).toBe(true);
    expect(isSecureRequest('http://10.0.0.2:8420/api', 'http, https')).toBe(false);
  });

  it('is not secure over plain HTTP', () => {
    expect(isSecureRequest('http://localhost:8420/api', undefined)).toBe(false);
  });
});
