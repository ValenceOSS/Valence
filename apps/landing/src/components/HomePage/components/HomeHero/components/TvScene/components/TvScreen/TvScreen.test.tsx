import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TvScreen } from './TvScreen';

describe('TvScreen', () => {
  it('shows what it is given', () => {
    render(
      <TvScreen>
        <p>On tonight</p>
      </TvScreen>,
    );

    expect(screen.getByText('On tonight')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TvScreen.displayName).toBe('TvScreen');
  });
});
