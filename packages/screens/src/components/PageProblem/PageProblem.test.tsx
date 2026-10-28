import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageProblem } from './PageProblem';

afterEach(() => {
  vi.unstubAllGlobals();
});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderWithClient = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);

describe('PageProblem', () => {
  it('says on the splash screen that the page stopped, rather than showing nothing at all', () => {
    renderWithClient(<PageProblem />);

    expect(screen.getByRole('alert')).toHaveTextContent('This page stopped working');
  });

  it('says why, by what kind of failure it was', () => {
    renderWithClient(<PageProblem error={new Error('TypeError: Failed to fetch')} />);

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/Can[\u0027\u2019]t reach Valence/);
  });

  it('offers a way to try again', async () => {
    const reload = vi.fn();
    const actor = userEvent.setup();

    vi.stubGlobal('location', { ...window.location, reload });

    renderWithClient(<PageProblem />);

    await actor.click(screen.getByRole('button', { name: 'Try again' }));

    expect(reload).toHaveBeenCalled();
  });
});
