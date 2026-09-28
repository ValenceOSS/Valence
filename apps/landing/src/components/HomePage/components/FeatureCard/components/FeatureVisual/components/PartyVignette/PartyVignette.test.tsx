import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PartyVignette } from './PartyVignette';

describe('PartyVignette', () => {
  it('keeps a party watching the same moment', () => {
    render(<PartyVignette />);

    expect(screen.getAllByText('Friday film night')[0]).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PartyVignette.displayName).toBe('PartyVignette');
  });
});
