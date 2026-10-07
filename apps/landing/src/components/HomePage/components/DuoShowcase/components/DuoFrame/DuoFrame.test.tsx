import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DuoFrame } from './DuoFrame';

describe('DuoFrame', () => {
  it('sets what the screen shows into the hole the picture leaves for it, scaled to the picture', () => {
    const { container } = render(
      <DuoFrame
        frame="/duo/frame-open.webp"
        width={1000}
        height={500}
        screen={{ left: 100, top: 50, width: 800, height: 400 }}
      >
        <p>On screen</p>
      </DuoFrame>,
    );

    const screenArea = screen.getByText('On screen').parentElement;

    expect(container.firstElementChild).toHaveStyle({ aspectRatio: '1000 / 500' });
    expect(screenArea).toHaveStyle({ left: '10%', top: '10%', width: '80%', height: '80%' });
    expect(container.querySelector('img')).toHaveAttribute('src', '/duo/frame-open.webp');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DuoFrame.displayName).toBe('DuoFrame');
  });
});
