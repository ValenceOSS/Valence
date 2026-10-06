import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProsePage } from './ProsePage';

describe('ProsePage', () => {
  it('names the page and sets its text out beneath', () => {
    render(
      <ProsePage eyebrow="Last updated 2026" title="Terms">
        <p>The words.</p>
      </ProsePage>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Terms' })).toBeInTheDocument();
    expect(screen.getByText('Last updated 2026')).toBeInTheDocument();
    expect(screen.getByText('The words.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProsePage.displayName).toBe('ProsePage');
  });
});
