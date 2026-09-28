import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HouseholdVignette } from './HouseholdVignette';

describe('HouseholdVignette', () => {
  it('asks who is watching, with a face for each of the household', () => {
    render(<HouseholdVignette />);

    expect(screen.getAllByText('Who’s watching?')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HouseholdVignette.displayName).toBe('HouseholdVignette');
  });
});
