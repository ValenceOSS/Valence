import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FilterBar } from './FilterBar';

const GROUPS = [
  { name: 'Genre', options: [{ id: 'genre:Drama', label: 'Drama' }] },
  { name: 'Decade', options: [{ id: 'decade:1990', label: '1990s' }], isSingle: true },
];

/**
 * Makes every element measure as given, and watching for a change of size answer at once.
 *
 * @param scrollWidth - How wide the row of filters is.
 * @param clientWidth - How much room there is for it.
 */
const measuring = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth);
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private readonly told: (entries: readonly ResizeObserverEntry[]) => void;

      constructor(told: (entries: readonly ResizeObserverEntry[]) => void) {
        this.told = told;
      }

      observe() {
        this.told([]);
      }

      unobserve() {
        return undefined;
      }

      disconnect() {
        return undefined;
      }
    },
  );
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('FilterBar', () => {
  it('shows a choice for each kind of filter where they fit', () => {
    measuring(400, 800);

    render(
      <FilterBar label="Filter films" groups={GROUPS} selected={new Set()} onChange={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: /Genre/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decade/ })).toBeInTheDocument();
  });

  it('gathers the kinds into one choice where they do not, each opened in turn', async () => {
    measuring(800, 400);
    const onChange = vi.fn();

    render(
      <FilterBar
        label="Filter films"
        groups={GROUPS}
        selected={new Set(['genre:Drama'])}
        onChange={onChange}
      />,
    );

    expect(screen.queryByRole('button', { name: /Genre/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Filter films' }));

    expect(await screen.findByRole('menuitem', { name: /Genre.*1/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: /Decade/ }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: '1990s' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['genre:Drama', 'decade:1990']));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FilterBar.displayName).toBe('FilterBar');
  });
});
