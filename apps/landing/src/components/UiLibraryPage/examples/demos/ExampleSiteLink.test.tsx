import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExampleSiteLink } from './ExampleSiteLink';

describe('ExampleSiteLink', () => {
  it('opens the place it names by its address', () => {
    render(
      <ExampleSiteLink to="/ui" className="nav-link">
        Components
      </ExampleSiteLink>,
    );

    expect(screen.getByRole('link', { name: 'Components' })).toHaveAttribute('href', '/ui');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ExampleSiteLink.displayName).toBe('ExampleSiteLink');
  });
});
