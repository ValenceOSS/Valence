import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollFade } from './ScrollFade';

describe('ScrollFade', () => {
  it('holds what it is given in a box that scrolls', () => {
    render(
      <ScrollFade className="max-h-40">
        <p>Inside</p>
      </ScrollFade>,
    );

    const box = screen.getByText('Inside').parentElement;

    expect(box).toHaveAttribute('data-slot', 'scroll-fade');
    expect(box).toHaveClass('overflow-y-auto', 'max-h-40');
  });

  it('fades neither edge while everything fits', () => {
    render(
      <ScrollFade>
        <p>Short</p>
      </ScrollFade>,
    );

    const box = screen.getByText('Short').parentElement;

    expect(box).not.toHaveAttribute('data-more-above');
    expect(box).not.toHaveAttribute('data-more-below');
  });
});
