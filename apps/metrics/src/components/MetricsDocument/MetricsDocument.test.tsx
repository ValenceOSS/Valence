import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MetricsDocument } from './MetricsDocument';

vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/') }));

describe('MetricsDocument', () => {
  it('draws the page into an English document inside the site’s frame', () => {
    const markup = renderToStaticMarkup(
      <MetricsDocument>
        <p>The page</p>
      </MetricsDocument>,
    );

    expect(markup).toMatch(/^<html lang="en"><body>/u);
    expect(markup).toContain('<main');
    expect(markup).toContain('<p>The page</p>');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MetricsDocument.displayName).toBe('MetricsDocument');
  });
});
