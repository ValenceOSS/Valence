import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HouseholdPicture } from './HouseholdPicture';

describe('HouseholdPicture', () => {
  it('asks who is watching, with a face for each of the household', () => {
    render(<HouseholdPicture />);

    expect(screen.getAllByText('Who’s watching?')[0]).toBeInTheDocument();
  });

  it('marks the face kept behind a PIN, as the app does', () => {
    render(<HouseholdPicture />);

    expect(screen.getAllByLabelText('Has a PIN')).toHaveLength(1);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('names the account the household signed in with', () => {
    render(<HouseholdPicture />);

    expect(screen.getByText('Signed in as The Okafors')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HouseholdPicture.displayName).toBe('HouseholdPicture');
  });
});
