import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeatureSection } from './FeatureSection';
import type { Feature } from '@ValenceLanding/content/features';

const featuresNamed = (...titles: string[]): Feature[] =>
  titles.map((title) => ({ title, detail: `${title} in detail.`, visual: 'terminal' }));

describe('FeatureSection', () => {
  it('names the group and draws each of its features, numbered by the group', () => {
    render(
      <FeatureSection
        group={{
          title: 'Platform',
          detail: 'What it takes to run it.',
          features: featuresNamed('One image', 'Read only', 'Real auth'),
        }}
        number={5}
      />,
    );

    const region = screen.getByRole('region', { name: 'Platform' });

    expect(within(region).getByText('What it takes to run it.')).toBeInTheDocument();
    expect(within(region).getByRole('heading', { name: 'Read only' })).toBeInTheDocument();
    expect(within(region).getByText('Fig 5.2')).toBeInTheDocument();
  });

  it('lays a group of three in equal cells', () => {
    render(
      <FeatureSection
        group={{ title: 'Platform', detail: 'Run it.', features: featuresNamed('A', 'B', 'C') }}
        number={5}
      />,
    );

    for (const item of screen.getAllByRole('listitem')) {
      expect(item).not.toHaveClass('sm:col-span-2');
    }
  });

  it('alternates a group of four, wide then square, then square then wide', () => {
    render(
      <FeatureSection
        group={{
          title: 'Viewing',
          detail: 'Watch.',
          features: featuresNamed('First', 'Second', 'Third', 'Fourth'),
        }}
        number={1}
      />,
    );

    const items = screen.getAllByRole('listitem');

    expect(items[0]).toHaveClass('sm:col-span-2');
    expect(items[1]).not.toHaveClass('sm:col-span-2');
    expect(items[2]).not.toHaveClass('sm:col-span-2');
    expect(items[3]).toHaveClass('sm:col-span-2');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FeatureSection.displayName).toBe('FeatureSection');
  });
});
