import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrailerBackdrop } from './TrailerBackdrop';

describe('TrailerBackdrop', () => {
  it('draws the backdrop and what closes the dialog without a trailer', () => {
    render(
      <TrailerBackdrop
        backdrop={<img alt="Backdrop" src="/backdrop.jpg" />}
        trailerUrl={null}
        label="The trailer"
        closing={<span>Close</span>}
      />,
    );

    expect(screen.getByAltText('Backdrop')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TrailerBackdrop.displayName).toBe('TrailerBackdrop');
  });
});
