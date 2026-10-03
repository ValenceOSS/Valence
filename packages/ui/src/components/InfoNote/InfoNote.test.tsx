import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InfoNote } from './InfoNote';

describe('InfoNote', () => {
  it('qualifies the rows above it, set off by a rule in quieter type', () => {
    render(<InfoNote>Measured across the whole card.</InfoNote>);

    expect(screen.getByText('Measured across the whole card.')).toHaveClass(
      'border-t',
      'text-xs',
      'text-text-muted',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(InfoNote.displayName).toBe('InfoNote');
  });
});
