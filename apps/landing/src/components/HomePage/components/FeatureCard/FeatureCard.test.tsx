import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HardDrive as HardDriveIcon } from '@keyline-icons/react';
import { FeatureCard } from './FeatureCard';

describe('FeatureCard', () => {
  it('names the feature and says why it matters', () => {
    render(
      <ul>
        <FeatureCard
          feature={{
            icon: HardDriveIcon,
            title: 'One image',
            detail: 'Everything in one place.',
            visual: 'window',
          }}
          index={0}
        />
      </ul>,
    );

    expect(screen.getByText('One image')).toBeInTheDocument();
    expect(screen.getByText('Everything in one place.')).toBeInTheDocument();
  });

  it('draws the featured card of a group larger than the rest', () => {
    render(
      <ul>
        <FeatureCard
          feature={{
            icon: HardDriveIcon,
            title: 'One image',
            detail: 'Everything in one place.',
            visual: 'window',
          }}
          index={0}
          isFeatured
        />
      </ul>,
    );

    expect(screen.getByRole('heading', { name: 'One image' })).toHaveClass('text-2xl');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureCard.displayName).toBe('FeatureCard');
  });
});
