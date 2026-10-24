import { act, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';
import { buildRouter } from './buildRouter';

describe('buildRouter', () => {
  it('fetches a page’s code before drawing it, so it is whole on the first frame', async () => {
    const router = buildRouter(createMemoryHistory({ initialEntries: ['/terms'] }));

    await router.load();
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Terms' })).toBeInTheDocument();

    await act(() => router.navigate({ to: '/privacy' }));

    expect(screen.queryByRole('heading', { level: 1, name: 'Terms' })).toBeNull();
    expect(await screen.findByRole('heading', { level: 1, name: 'Privacy' })).toBeInTheDocument();
  });

  it('sends the old roadmap address to the principles', async () => {
    const router = buildRouter(createMemoryHistory({ initialEntries: ['/roadmap'] }));

    await router.load();

    expect(router.state.location.pathname).toBe('/principles');
  });
});
