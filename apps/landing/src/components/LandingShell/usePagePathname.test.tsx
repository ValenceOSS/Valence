import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { PagePathnameContext } from './PagePathnameContext';
import { usePagePathname } from './usePagePathname';

/** Shows the pathname the hook hands back. */
const Shown = () => <output>{usePagePathname()}</output>;

describe('usePagePathname', () => {
  it('keeps the address the page arrived with, whatever the router says now', async () => {
    await renderWithRoutes(
      () => (
        <PagePathnameContext value="/changelog/television-everywhere">
          <Shown />
        </PagePathnameContext>
      ),
      '/changelog',
    );

    expect(screen.getByRole('status')).toHaveTextContent('/changelog/television-everywhere');
  });

  it("falls back to the router's address outside the shell", async () => {
    await renderWithRoutes(Shown, '/about');

    expect(screen.getByRole('status')).toHaveTextContent('/about');
  });
});
