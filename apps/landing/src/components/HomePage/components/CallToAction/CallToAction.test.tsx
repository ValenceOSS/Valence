import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CallToAction } from './CallToAction';

describe('CallToAction', () => {
  it('closes the page with a way into the quick start', () => {
    render(<CallToAction />);

    expect(
      screen.getByRole('heading', { name: 'Run it on what you already have' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Read the quick start' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CallToAction.displayName).toBe('CallToAction');
  });
});
