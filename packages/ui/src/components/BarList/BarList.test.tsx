import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BarList } from './BarList';
import type { BarListProps } from './BarList.types';

const ITEMS = [
  { id: 'jobs', label: 'jobs', value: 40 },
  { id: 'scanner', label: 'scanner', value: 10, detail: 'Reads files' },
];

const draw = (over: Partial<BarListProps> = {}) =>
  render(
    <BarList
      items={ITEMS}
      label="Top sources"
      heading="Source"
      valueHeading="Events"
      emptyMessage="No sources."
      {...over}
    />,
  );

describe('BarList', () => {
  it('lists each row with its figure, under the headings', () => {
    draw();

    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Top sources' })).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('Reads files')).toBeInTheDocument();
  });

  it('draws each bar as a share of the biggest', () => {
    const { container } = draw();
    const widths = Array.from(container.querySelectorAll<HTMLElement>('[data-fill]')).map(
      (bar) => bar.style.width,
    );

    expect(widths).toStrictEqual(['100%', '25%']);
  });

  it('draws its bars in quiet stripes unless it is asked for solid ones', () => {
    const { container, rerender } = draw();
    const striped = container.querySelector('[data-fill]');

    expect(striped?.className).toContain('repeating-linear-gradient');
    expect(striped).not.toHaveClass('bg-accent');

    rerender(
      <BarList
        items={ITEMS}
        label="Top sources"
        heading="Source"
        valueHeading="Events"
        emptyMessage="No sources."
        fill="solid"
      />,
    );

    const solid = container.querySelector('[data-fill]');

    expect(solid).toHaveClass('bg-accent');
    expect(solid?.className).not.toContain('repeating-linear-gradient');
  });

  it('writes each figure the caller’s way where it is handed one', () => {
    draw({ figureOf: (item) => `${(item.value / 50).toString()} of all` });

    expect(screen.getByText('0.8 of all')).toBeInTheDocument();
    expect(screen.getByText('0.2 of all')).toBeInTheDocument();
    expect(screen.queryByText('40')).not.toBeInTheDocument();
  });

  it('says so where there are no rows', () => {
    draw({ items: [] });

    expect(screen.getByText('No sources.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('is only to be read where nobody is listening for a choice', () => {
    draw();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('narrows to a row when it is pressed', async () => {
    const onChoose = vi.fn();

    draw({ onChoose });
    await userEvent.click(screen.getByRole('button', { name: /scanner/ }));

    expect(onChoose).toHaveBeenCalledWith('scanner');
  });

  it('says which rows are already chosen', () => {
    draw({ onChoose: vi.fn(), chosen: new Set(['jobs']) });

    expect(screen.getByRole('button', { name: /jobs/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /scanner/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BarList.displayName).toBe('BarList');
  });
});
