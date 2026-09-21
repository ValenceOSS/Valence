import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppliedFilters } from './AppliedFilters';

const GROUPS = [
  { name: 'Genre', options: [{ id: 'genre:Drama', label: 'Drama' }] },
  { name: 'Decade', options: [{ id: 'decade:1990', label: '1990s' }] },
] as const;

describe('AppliedFilters', () => {
  it('draws nothing while nothing is applied', () => {
    const { container } = render(
      <AppliedFilters groups={GROUPS} selected={new Set()} onRemove={vi.fn()} onClear={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lines each chip and the way to clear them up on one line, level with each other', () => {
    render(
      <AppliedFilters
        groups={GROUPS}
        selected={new Set(['genre:Drama'])}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    for (const item of screen.getAllByRole('listitem')) {
      expect(item).toHaveClass('flex', 'h-7', 'items-center');
    }
  });

  it('says each applied filter with the name of what it narrows', () => {
    render(
      <AppliedFilters
        groups={GROUPS}
        selected={new Set(['genre:Drama', 'decade:1990'])}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText('Genre: Drama')).toBeInTheDocument();
    expect(screen.getByText('Decade: 1990s')).toBeInTheDocument();
  });

  it('takes one off when its chip is pressed', async () => {
    const onRemove = vi.fn();

    render(
      <AppliedFilters
        groups={GROUPS}
        selected={new Set(['genre:Drama', 'decade:1990'])}
        onRemove={onRemove}
        onClear={vi.fn()}
      />,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove Genre: Drama' }));

    expect(onRemove).toHaveBeenCalledWith('genre:Drama');
  });

  it('takes every one off at once', async () => {
    const onClear = vi.fn();

    render(
      <AppliedFilters
        groups={GROUPS}
        selected={new Set(['genre:Drama'])}
        onRemove={vi.fn()}
        onClear={onClear}
      />,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onClear).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AppliedFilters.displayName).toBe('AppliedFilters');
  });
});
