import { afterEach, describe, expect, it } from 'vitest';
import { keepCanonical } from './keepCanonical';

afterEach(() => {
  document.head.querySelector('link[rel="canonical"]')?.remove();
});

describe('keepCanonical', () => {
  it('adds a canonical link on the www host, and moves it as the page changes', () => {
    keepCanonical('/features');

    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.getvalence.app/features',
    );

    keepCanonical('/downloads');

    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://www.getvalence.app/downloads',
    );
  });
});
