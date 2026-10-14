import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PanelCardInfo } from './PanelCardInfo';

describe('PanelCardInfo', () => {
  it('is a button named for what it explains', () => {
    render(<PanelCardInfo label="About email" detail="Sends sign-in links." />);

    expect(screen.getByRole('button', { name: 'About email' })).toBeInTheDocument();
  });

  it('keeps what the card is for out of the way until it is pointed at', () => {
    render(<PanelCardInfo label="About email" detail="Sends sign-in links." />);

    expect(screen.queryByText('Sends sign-in links.')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PanelCardInfo.displayName).toBe('PanelCardInfo');
  });
});
