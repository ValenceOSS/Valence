import { describe, expect, it } from 'vitest';
import { BROWSER_NAMES } from './BROWSER_NAMES';

describe('BROWSER_NAMES', () => {
  it('names each browser as it calls itself', () => {
    expect(BROWSER_NAMES.chrome).toBe('Chrome');
    expect(BROWSER_NAMES.chromium).toBe('Chromium');
    expect(BROWSER_NAMES.samsungInternet).toBe('Samsung Internet');
  });
});
