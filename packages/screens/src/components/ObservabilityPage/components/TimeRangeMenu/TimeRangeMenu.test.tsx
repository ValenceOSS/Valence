import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TimeRangeMenu } from './TimeRangeMenu';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';

const draw = (search: ObservabilitySearch = {}) => {
  const onSearchChange = vi.fn();

  render(<TimeRangeMenu search={search} onSearchChange={onSearchChange} />);

  return onSearchChange;
};

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Time range' }));
};

describe('TimeRangeMenu', () => {
  it('says the last day where the address says nothing', () => {
    draw();

    expect(screen.getByRole('button', { name: 'Time range' })).toHaveTextContent('Last 24 hours');
  });

  it('says the range the address names', () => {
    draw({ range: 'all' });

    expect(screen.getByRole('button', { name: 'Time range' })).toHaveTextContent('Everything kept');
  });

  it('says so where the log has been zoomed into a stretch', () => {
    draw({ range: '7d', from: 100, until: 200 });

    expect(screen.getByRole('button', { name: 'Time range' })).toHaveTextContent('Zoomed in');
  });

  it('offers every range, with the one in force chosen', async () => {
    draw({ range: '6h' });

    await open();

    expect(await screen.findAllByRole('menuitemradio')).toHaveLength(6);
    expect(screen.getByRole('menuitemradio', { name: 'Last 6 hours' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('chooses none of them while zoomed', async () => {
    draw({ from: 100, until: 200 });

    await open();

    for (const one of await screen.findAllByRole('menuitemradio')) {
      expect(one).toHaveAttribute('aria-checked', 'false');
    }
  });

  it('writes the range chosen, and takes any zoom off', async () => {
    const onSearchChange = draw({ from: 100, until: 200 });

    await open();
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Everything kept' }));

    expect(onSearchChange).toHaveBeenCalledWith({
      range: 'all',
      from: undefined,
      until: undefined,
    });
  });

  it('leaves the address bare when the default range is chosen', async () => {
    const onSearchChange = draw({ range: 'all' });

    await open();
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Last 24 hours' }));

    expect(onSearchChange).toHaveBeenCalledWith({
      range: undefined,
      from: undefined,
      until: undefined,
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TimeRangeMenu.displayName).toBe('TimeRangeMenu');
  });
});
