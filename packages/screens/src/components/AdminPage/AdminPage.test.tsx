import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AdminPage } from './AdminPage';
import type * as Router from '@tanstack/react-router';

const go = vi.fn(() => Promise.resolve());

const address: { panel?: string } = {};

vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof Router>()),
  useParams: () => address,
  useSearch: () => ({}),
  useNavigate: () => go,
}));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({ may: () => true, mayAdminister: true, isDemo: false, isLoading: false }),
}));

vi.mock('@ValenceScreens/components/AdminArea/AdminArea', () => ({
  AdminArea: ({ panel }: { panel: string }) => <p>{`Showing ${panel}`}</p>,
}));

vi.mock('@ValenceClient/admin/fetchAdmin', async (original) => ({
  ...(await original<object>()),
  fetchAdminOverview: () => new Promise(() => undefined),
}));

vi.mock('@ValenceClient/requests/fetchRequests', async (original) => ({
  ...(await original<object>()),
  fetchRequestsAvailability: () => Promise.resolve({ isEnabled: false }),
}));

vi.mock('@ValenceClient/session/readVersion', () => ({
  readVersion: () => new Promise(() => undefined),
}));

/**
 * A window as wide as asked: a phone, or one with room for the sidebar.
 */
const aWindow = (hasRoom: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: hasRoom,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

/**
 * Whether the sidebar can be reached, which a closed drawer cannot.
 */
const isSidebarReachable = () =>
  screen.getByRole('navigation', { hidden: true }).closest('[inert]') === null;

afterEach(() => {
  vi.unstubAllGlobals();
  delete address.panel;
});

describe('AdminPage', () => {
  it('opens at its full width on a phone, naming the section in a bar across the top', async () => {
    aWindow(false);

    renderInAnAddress(<AdminPage />);

    expect(await screen.findByText('Showing overview')).toBeInTheDocument();
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(isSidebarReachable()).toBe(false);
  });

  it('slides the sidebar in from the bar, and lets it go on Escape or a tap beside it', async () => {
    const user = userEvent.setup();

    aWindow(false);
    renderInAnAddress(<AdminPage />);

    await user.click(await screen.findByRole('button', { name: 'Open the sidebar' }));

    expect(isSidebarReachable()).toBe(true);

    await user.keyboard('{Escape}');

    expect(isSidebarReachable()).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Open the sidebar' }));
    await user.click(
      screen.getAllByRole('button', { name: 'Close the sidebar' })[0] ?? document.body,
    );

    expect(isSidebarReachable()).toBe(false);
  });

  it('lets the sidebar go once a section is chosen in it, showing that section', async () => {
    const user = userEvent.setup();

    aWindow(false);

    const { rerender } = renderInAnAddress(<AdminPage />);

    await user.click(await screen.findByRole('button', { name: 'Open the sidebar' }));
    await user.click(screen.getByRole('button', { name: 'Libraries' }));

    expect(go).toHaveBeenCalledWith({ to: '/admin/$panel', params: { panel: 'libraries' } });

    address.panel = 'libraries';
    rerender(<AdminPage />);

    expect(await screen.findByText('Showing libraries')).toBeInTheDocument();
    expect(isSidebarReachable()).toBe(false);
  });

  it('keeps the sidebar beside the page where there is room for it', async () => {
    aWindow(true);

    renderInAnAddress(<AdminPage />);

    expect(await screen.findByText('Showing overview')).toBeInTheDocument();
    expect(isSidebarReachable()).toBe(true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AdminPage.displayName).toBe('AdminPage');
  });
});
