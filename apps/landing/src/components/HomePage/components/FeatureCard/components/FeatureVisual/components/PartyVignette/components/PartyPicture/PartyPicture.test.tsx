import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PartyPicture } from './PartyPicture';

describe('PartyPicture', () => {
  it('shows one of the party drifting behind the others', () => {
    render(<PartyPicture />);

    expect(screen.getByText('Ruth is 7.0s behind')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Each member’s position in the party' }),
    ).toBeInTheDocument();
  });

  it('brings everybody back into line', () => {
    render(<PartyPicture isInSync />);

    expect(screen.getByText('In sync')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PartyPicture.displayName).toBe('PartyPicture');
  });
});
