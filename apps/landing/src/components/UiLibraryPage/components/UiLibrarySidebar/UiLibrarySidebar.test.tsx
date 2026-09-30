import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { UiLibrarySidebar } from './UiLibrarySidebar';

const doc = (name: string) => ({ name, summary: '', props: [], inherits: [], builtOn: [] });

const GROUPS = [
  { name: 'Buttons', components: [doc('Button'), doc('Link')] },
  { name: 'Feedback', components: [doc('Badge')] },
];

describe('UiLibrarySidebar', () => {
  it('lists each group and its components, linking to each', async () => {
    await renderWithRoutes(() => (
      <UiLibrarySidebar groups={GROUPS} selected="Link" query="" onQueryChange={vi.fn()} />
    ));

    expect(screen.getByRole('region', { name: 'Buttons' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute('href', '/ui/button');
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('aria-current', 'page');
  });

  it('passes on what is typed into the search box', async () => {
    const onQueryChange = vi.fn();

    await renderWithRoutes(() => (
      <UiLibrarySidebar groups={GROUPS} selected={null} query="" onQueryChange={onQueryChange} />
    ));

    await userEvent.type(screen.getByRole('searchbox', { name: 'Find a component' }), 'b');

    expect(onQueryChange).toHaveBeenCalledWith('b');
  });

  it('says so when nothing matches', async () => {
    await renderWithRoutes(() => (
      <UiLibrarySidebar groups={[]} selected={null} query="zzz" onQueryChange={vi.fn()} />
    ));

    expect(screen.getByText('Nothing matches that.')).toBeInTheDocument();
  });

  it('tells a drawer a component was chosen', async () => {
    const onChoose = vi.fn();

    await renderWithRoutes(() => (
      <UiLibrarySidebar
        groups={GROUPS}
        selected={null}
        query=""
        onQueryChange={vi.fn()}
        onChoose={onChoose}
      />
    ));

    await userEvent.click(screen.getByRole('link', { name: 'Badge' }));

    expect(onChoose).toHaveBeenCalled();
  });

  it('is named for people who cannot see it', () => {
    expect(UiLibrarySidebar.displayName).toBe('UiLibrarySidebar');
  });
});
