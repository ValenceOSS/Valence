import { describe, expect, it } from 'vitest';
import { pageFor } from './pageFor';
import { preloadPage } from './preloadPage';

describe('preloadPage', () => {
  it('fetches a lazily drawn page, and leaves the home page and unknown addresses alone', async () => {
    await expect(preloadPage('/brand')).resolves.toBeUndefined();
    await expect(preloadPage('/')).resolves.toBeUndefined();
    await expect(preloadPage('/nowhere')).resolves.toBeUndefined();

    const brand = pageFor('/brand');

    expect('preload' in brand && (await brand.preload()).displayName).toBe('BrandPage');
  });
});
