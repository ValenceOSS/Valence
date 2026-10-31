import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroWindow } from './HeroWindow';

const SHOTS = [
  { id: 'one', src: '/tour/home.jpg', alt: 'The first screen' },
  { id: 'two', src: '/tour/library.jpg', alt: 'The second screen' },
] as const;

describe('HeroWindow', () => {
  it('names only the screenshot that is showing', () => {
    render(<HeroWindow shots={SHOTS} active={1} isStill={false} />);

    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'The second screen' })).toHaveClass('opacity-100');
  });

  it('offers each screenshot at several widths', () => {
    render(<HeroWindow shots={SHOTS} active={0} isStill={false} />);

    expect(screen.getByRole('img', { name: 'The first screen' }).getAttribute('srcset')).toContain(
      '/tour/home-1600.webp 1600w',
    );
  });

  it('changes screenshot without a fade for whoever asked for stillness', () => {
    render(<HeroWindow shots={SHOTS} active={0} isStill />);

    expect(screen.getByRole('img', { name: 'The first screen' })).not.toHaveClass(
      'transition-opacity',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HeroWindow.displayName).toBe('HeroWindow');
  });
});
