import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IsometricStage } from './IsometricStage';

describe('IsometricStage', () => {
  it('sets what it is given on a tilted plane inside a stage with depth', () => {
    render(
      <IsometricStage>
        <p>Watch party</p>
      </IsometricStage>,
    );

    const plane = screen.getByText('Watch party').parentElement;

    expect(plane).toHaveClass('valence-iso__plane');
    expect(plane?.parentElement).toHaveClass('valence-iso');
    expect(plane?.parentElement).toHaveAttribute('data-slot', 'isometric-stage');
  });

  it('draws nothing of its own besides the stage and the plane', () => {
    const { container } = render(
      <IsometricStage>
        <span>Card</span>
      </IsometricStage>,
    );

    expect(container.querySelectorAll('.valence-iso')).toHaveLength(1);
    expect(container.querySelectorAll('.valence-iso__plane')).toHaveLength(1);
    expect(container.textContent).toBe('Card');
  });
});
