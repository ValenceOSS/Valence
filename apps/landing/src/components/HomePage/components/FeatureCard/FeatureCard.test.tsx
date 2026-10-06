import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from './FeatureCard';

const FEATURE = {
  title: 'One image',
  detail: 'Everything in one place.',
  visual: 'terminal',
} as const;

describe('FeatureCard', () => {
  it('names the feature and says why it matters', () => {
    render(
      <ul>
        <FeatureCard feature={FEATURE} index={0} />
      </ul>,
    );

    expect(screen.getByRole('heading', { name: 'One image' })).toBeInTheDocument();
    expect(screen.getByText('Everything in one place.')).toBeInTheDocument();
  });

  it('sits in a cell of the grid, ruled off from the cells beside it', () => {
    render(
      <ul>
        <FeatureCard feature={FEATURE} index={0} />
      </ul>,
    );

    expect(screen.getByRole('listitem')).toHaveClass(
      'before:bg-linear-to-r',
      'after:bg-linear-to-b',
    );
  });

  it('follows the pointer with its light', () => {
    render(
      <ul>
        <FeatureCard feature={FEATURE} index={0} />
      </ul>,
    );

    const card = screen.getByRole('article');

    card.dispatchEvent(new PointerEvent('pointermove', { clientX: 40, clientY: 30 }));

    expect(card.style.getPropertyValue('--spot-x')).toMatch(/px$/u);
    expect(card.style.getPropertyValue('--spot-y')).toMatch(/px$/u);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureCard.displayName).toBe('FeatureCard');
  });
});
