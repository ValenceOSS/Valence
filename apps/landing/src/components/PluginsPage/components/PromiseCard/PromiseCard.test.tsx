import { render, screen } from '@testing-library/react';
import { Lock } from '@keyline-icons/react';
import { describe, expect, it } from 'vitest';
import { PromiseCard } from './PromiseCard';

describe('PromiseCard', () => {
  it('names the promise and says what it means', () => {
    render(<PromiseCard title="Asks first" text="You see what it wants first." glyph={Lock} />);

    expect(screen.getByRole('heading', { name: 'Asks first' })).toBeInTheDocument();
    expect(screen.getByText('You see what it wants first.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PromiseCard.displayName).toBe('PromiseCard');
  });
});
