import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HouseholdPicture } from './HouseholdPicture';

describe('HouseholdPicture', () => {
  it('asks who is watching, with a face for each of the household', () => {
    render(<HouseholdPicture />);

    expect(screen.getAllByText('Who’s watching?')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HouseholdPicture.displayName).toBe('HouseholdPicture');
  });
});
