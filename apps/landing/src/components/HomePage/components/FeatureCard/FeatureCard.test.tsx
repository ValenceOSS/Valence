import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureCard } from './FeatureCard';

const FEATURE = {
  title: 'One image',
  detail: 'Everything in one place.',
  visual: 'terminal',
} as const;

describe('FeatureCard', () => {
  it('names the feature, says why it matters and numbers it as a figure', () => {
    render(
      <ul>
        <FeatureCard feature={FEATURE} index={0} figure="5.1" />
      </ul>,
    );

    expect(screen.getByRole('heading', { name: 'One image' })).toBeInTheDocument();
    expect(screen.getByText('Everything in one place.')).toBeInTheDocument();
    expect(screen.getByText('Fig 5.1')).toBeInTheDocument();
  });

  it('draws a wide feature across two cells, with a larger title', () => {
    render(
      <ul>
        <FeatureCard feature={FEATURE} index={0} figure="1.1" shape="wide" />
      </ul>,
    );

    expect(screen.getByRole('heading', { name: 'One image' })).toHaveClass('text-xl');
    expect(screen.getByRole('listitem')).toHaveClass('sm:col-span-2');
  });

  it('follows the pointer with its light', () => {
    render(
      <ul>
        <FeatureCard feature={FEATURE} index={0} figure="1.1" />
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
