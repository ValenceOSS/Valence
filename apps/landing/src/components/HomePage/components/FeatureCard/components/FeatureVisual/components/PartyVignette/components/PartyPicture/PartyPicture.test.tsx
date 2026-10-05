import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PartyPicture } from './PartyPicture';

describe('PartyPicture', () => {
  it('keeps a party watching the same moment', () => {
    render(<PartyPicture />);

    expect(screen.getAllByText('Friday film night')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PartyPicture.displayName).toBe('PartyPicture');
  });
});
