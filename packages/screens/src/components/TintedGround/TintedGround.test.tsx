import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TintedGround } from './TintedGround';

describe('TintedGround', () => {
  it('tints the ground with the colour it is given', () => {
    render(
      <TintedGround tint="rgb(25, 56, 30)">
        <p>Inside</p>
      </TintedGround>,
    );

    expect(screen.getByText('Inside').parentElement?.style.backgroundImage).toContain(
      'rgb(25, 56, 30)',
    );
  });

  it('leaves the ground alone without a tint', () => {
    render(
      <TintedGround tint={null}>
        <p>Inside</p>
      </TintedGround>,
    );

    expect(screen.getByText('Inside').parentElement?.style.backgroundImage).toBe('');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TintedGround.displayName).toBe('TintedGround');
  });
});
