import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WayInBackground } from './WayInBackground';

describe('WayInBackground', () => {
  it('draws the picture an operator put behind the way in', () => {
    const { container } = render(<WayInBackground splashscreen="/api/splashscreen?v=1" />);

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/api/splashscreen?v=1');
  });

  it('draws no picture where there is none, rather than a broken one', () => {
    const { container } = render(<WayInBackground />);

    expect(container.querySelector('img')).toBeNull();
  });

  it('is hidden from anybody listening rather than read out as decoration', () => {
    const { container } = render(<WayInBackground splashscreen="/api/splashscreen" />);

    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes no clicks, so it cannot swallow one meant for the form on top of it', () => {
    const { container } = render(<WayInBackground />);

    expect(container.firstElementChild?.className).toContain('pointer-events-none');
  });
});
