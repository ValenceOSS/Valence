import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MetricsDocument } from './MetricsDocument';

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }));

describe('MetricsDocument', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws the page into an English document inside the site’s frame', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ stargazers_count: 235 }))),
    );

    const markup = renderToStaticMarkup(await MetricsDocument({ children: <p>The page</p> }));

    expect(markup).toMatch(/^<html lang="en"><body>/u);
    expect(markup).toContain('<main');
    expect(markup).toContain('<p>The page</p>');
    expect(markup).toContain('235');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MetricsDocument.displayName).toBe('MetricsDocument');
  });
});
