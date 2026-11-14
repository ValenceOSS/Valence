import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatStrip } from './StatStrip';

/**
 * How many ticks of the meter beside a figure are lit, or null where there is no meter.
 *
 * @param container - Where the strip was drawn.
 * @returns The lit ticks.
 */
const litTicks = (container: HTMLElement): number | null => {
  const lights = [...container.querySelectorAll('span[aria-hidden] > span > span')];

  return lights.length === 0
    ? null
    : lights.filter((light) => light.className.includes('opacity-100')).length;
};

describe('StatStrip', () => {
  it('names each figure', () => {
    render(<StatStrip stats={[{ label: 'Items', value: '15' }]} />);

    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  it('says each figure', () => {
    render(<StatStrip stats={[{ label: 'Items', value: '15' }]} />);

    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('reads as one instrument rather than four unrelated facts', () => {
    const { container } = render(
      <StatStrip
        stats={[
          { label: 'Items', value: '15' },
          { label: 'Libraries', value: '2' },
        ]}
      />,
    );

    expect(container.firstElementChild).toHaveClass('grid');
    expect(container.querySelectorAll('section.valence-card-shell')).toHaveLength(2);
    expect(screen.getAllByRole('heading')).toHaveLength(2);
  });

  it('draws a meter for a figure that is part of something larger', async () => {
    const { container } = render(
      <StatStrip
        stats={[
          {
            label: 'Memory',
            value: '8 GB',
            fraction: 0.5,
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(litTicks(container)).toBe(10);
    });
  });

  it('draws no meter for a figure that is only a number', () => {
    const { container } = render(<StatStrip stats={[{ label: 'Items', value: '15' }]} />);

    expect(litTicks(container)).toBeNull();
  });

  it('never lights more than every tick', async () => {
    const { container } = render(
      <StatStrip
        stats={[
          {
            label: 'CPU',
            value: '140%',
            fraction: 1.4,
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(litTicks(container)).toBe(20);
    });
  });

  it('adds a note where a figure needs one', () => {
    render(
      <StatStrip
        stats={[
          {
            label: 'Items',
            value: '15',
            detail: 'across 2 libraries',
          },
        ]}
      />,
    );

    expect(screen.getByText('across 2 libraries')).toBeInTheDocument();
  });

  it('shows nothing at all before there is anything to show', () => {
    render(<StatStrip stats={[]} />);

    expect(screen.queryAllByRole('heading')).toHaveLength(0);
  });

  it('stretches a figure left over on a row of its own across the row', () => {
    const { container } = render(
      <StatStrip
        stats={['Processor', 'Memory', 'Graphics', 'Storage', 'Network'].map((label) => ({
          label,
          value: '1',
        }))}
      />,
    );
    const tiles = container.querySelectorAll('section.valence-card-shell');

    expect(container.firstElementChild).toHaveClass('lg:grid-cols-4', '2xl:grid-cols-5');
    expect(tiles[4]).toHaveClass('col-span-2', 'lg:col-span-4', '2xl:col-span-1');
    expect(tiles[3]).not.toHaveClass('col-span-2');
  });
});
