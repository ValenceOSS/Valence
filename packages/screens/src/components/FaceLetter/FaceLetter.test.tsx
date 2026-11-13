import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FaceLetter } from './FaceLetter';

describe('FaceLetter', () => {
  it('draws the letter, kept from a reader, unmoved until it can be measured', () => {
    render(<FaceLetter letter="D" family="sans-serif" weight={600} />);

    expect(screen.getByText('D')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('D')).not.toHaveAttribute('style');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FaceLetter.displayName).toBe('FaceLetter');
  });
});
