import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OpenOnSite } from './OpenOnSite';

describe('OpenOnSite', () => {
  it('opens the page on the site, named for a reader by the site', () => {
    render(<OpenOnSite href="https://www.imdb.com/title/tt0000001/" label="Open on IMDb" />);

    expect(screen.getByRole('link', { name: 'Open on IMDb' })).toHaveAttribute(
      'href',
      'https://www.imdb.com/title/tt0000001/',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OpenOnSite.displayName).toBe('OpenOnSite');
  });
});
