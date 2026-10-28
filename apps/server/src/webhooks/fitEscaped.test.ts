import { describe, expect, it } from 'vitest';
import { escapeHtml } from '@ValenceServer/text/escapeHtml';
import { fitEscaped } from './fitEscaped';

describe('fitEscaped', () => {
  it('escapes text that fits as it is', () => {
    expect(fitEscaped('Tom & Jerry', 50, escapeHtml)).toBe('Tom &amp; Jerry');
  });

  it('cuts text that escaping would push over, measuring what is sent', () => {
    const fitted = fitEscaped('&'.repeat(100), 50, escapeHtml);

    expect(fitted.length).toBeLessThanOrEqual(50);
    expect(fitted).toMatch(/^(&amp;)+…$/);
  });

  it('gives nothing where there is no room at all', () => {
    expect(fitEscaped('Dune', 0, escapeHtml)).toBe('');
  });
});
