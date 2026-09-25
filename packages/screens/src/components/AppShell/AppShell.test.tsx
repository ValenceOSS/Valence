import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chosenTheme } from '@ValenceClient/shell/theme';
import { chosenMotion } from '@ValenceClient/shell/motion';
import { AppShell } from './AppShell';

import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import type { AppShellProps } from './AppShell.types';

const draw = (overrides: Partial<AppShellProps> = {}) => {
  const props: AppShellProps = {
    section: 'home',
    onSectionChange: vi.fn(),
    isAccountOpen: false,
    onOpenAccount: vi.fn(),
    onOpenAdmin: vi.fn(),
    isDownloadsOpen: false,
    onOpenDownloads: vi.fn(),
    isSearchOpen: false,
    onOpenSearch: vi.fn(),
    children: <p>The library</p>,
    ...overrides,
  };

  const view = render(<AppShell {...props} />);

  return { props, view };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AppShell', () => {
  it('draws what it was given', () => {
    draw();

    expect(screen.getByText('The library')).toBeInTheDocument();
  });

  it('offers a choice of library beside films when there are several of them', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    draw({
      libraryChoices: {
        films: {
          label: 'Film library',
          options: [
            { id: 'all', label: 'All film libraries' },
            { id: 'lib-4k', label: '4K' },
          ],
          selectedId: 'all',
          onSelect,
        },
      },
    });

    await user.click(screen.getByRole('button', { name: 'Film library' }));
    await user.click(await screen.findByRole('menuitemradio', { name: /4K/ }));

    expect(onSelect).toHaveBeenCalledWith('lib-4k');
    expect(screen.queryByRole('button', { name: 'Programme library' })).not.toBeInTheDocument();
  });

  it('leaves nothing to scroll around a section that fills the window', () => {
    const { view } = draw({ isFitted: true, dock: <p>Now playing</p> });

    expect(view.container.querySelector('main')).toHaveClass('overflow-clip');
    expect(view.container.querySelector('.valence-shell')).toHaveClass('overflow-clip');
    expect(screen.getByText('Now playing').parentElement).toHaveClass('h-0');
  });

  it('leaves an Escape something else has already answered alone', () => {
    const { props } = draw({ section: 'music' });
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

    escape.preventDefault();
    window.dispatchEvent(escape);

    expect(props.onSectionChange).not.toHaveBeenCalled();
  });

  it('keeps what is docked along the foot the same thing from one section to the next', () => {
    const { props, view } = draw({ dock: <p>Now playing</p> });
    const docked = screen.getByText('Now playing');

    view.rerender(
      <AppShell {...props} section="films">
        <p>The films</p>
      </AppShell>,
    );

    expect(screen.getByText('Now playing')).toBe(docked);
  });

  it('offers the few places worth going', () => {
    draw();

    for (const section of ['Home', 'Search', 'Account']) {
      expect(screen.getByRole('button', { name: section })).toBeInTheDocument();
    }
  });

  it('hides administration from everyone who does not administer', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(await screen.findByRole('menuitem', { name: 'My Account' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('offers administration to someone who does, in the menu on their face', async () => {
    const user = userEvent.setup();
    const { props } = draw({ isAdministrator: true });

    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Admin' }));

    expect(props.onOpenAdmin).toHaveBeenCalledOnce();
  });

  it('keeps My Account and Admin together, apart from the rest of the menu', async () => {
    const user = userEvent.setup();

    draw({ isAdministrator: true });

    await user.click(screen.getByRole('button', { name: 'Account' }));

    const mine = (await screen.findByRole('menuitem', { name: 'My Account' })).closest(
      '[role="group"]',
    );

    expect(mine).not.toBeNull();
    expect(mine?.textContent).toContain('Admin');
    expect(mine?.textContent).not.toContain('Favourites');
  });

  it('keeps administration off the bar itself, since it lives behind the face', () => {
    draw({ isAdministrator: true });

    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('says which section the viewer is in', () => {
    draw({ isSearchOpen: true });

    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  });

  it('offers downloads on a client that can keep a file', () => {
    draw();

    expect(screen.getByRole('button', { name: 'Downloads' })).toBeInTheDocument();
  });

  it('offers downloads in a browser too, to see how far along each has got', () => {
    installPlatform(aFakePlatform({ canKeepFiles: () => false }));

    draw();

    expect(screen.getByRole('button', { name: 'Downloads' })).toBeInTheDocument();
  });

  it('raises the account rather than going to it, since it is a dialog and not a section', async () => {
    const user = userEvent.setup();
    const { props } = draw();

    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(await screen.findByRole('menuitem', { name: 'My Account' }));

    expect(props.onOpenAccount).toHaveBeenCalledOnce();
    expect(props.onSectionChange).not.toHaveBeenCalled();
  });

  it('lights the face while the account is open, since no section is current then', () => {
    draw({ isAccountOpen: true });

    expect(
      screen.getByRole('button', { name: 'Account' }).closest('[data-highlight="account"]'),
    ).toHaveClass('text-text');
  });

  it('leaves the face unlit while neither dialog is open', () => {
    draw();

    expect(
      screen
        .getByRole('button', { name: 'Account' })
        .closest('[data-highlight="account"]')
        ?.querySelector('[data-mark]'),
    ).toBeNull();
  });

  it('changes the theme from a row of tabs in the menu on the face, marking the one in force', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(screen.getByRole('button', { name: 'Account' }));

    const theme = await screen.findByRole('group', { name: 'Theme' });

    expect(within(theme).getByRole('button', { name: 'System' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(theme).getByRole('button', { name: 'Dark' }));

    expect(chosenTheme()).toBe('dark');
  });

  it('changes how much moves from the same menu', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(screen.getByRole('button', { name: 'Account' }));

    const movement = await screen.findByRole('group', { name: 'Movement' });

    await user.click(within(movement).getByRole('button', { name: 'Reduced' }));

    expect(chosenMotion()).toBe('reduced');
  });

  it('offers a way back to the machine for the theme and for movement alike', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(screen.getByRole('button', { name: 'Account' }));

    expect(await screen.findAllByRole('button', { name: 'System' })).toHaveLength(2);
  });

  it('opens the questions people ask most from the menu on the face', async () => {
    const open = vi.fn();

    const user = userEvent.setup();

    vi.stubGlobal('open', open);
    draw();

    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Help' }));

    expect(open).toHaveBeenCalledWith(
      'https://docs.getvalence.app/start/faq',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('signs out from the menu on the face', async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();

    draw({ onSignOut });

    await user.click(screen.getByRole('button', { name: 'Account' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('offers no way to sign out where the page was given none', async () => {
    const user = userEvent.setup();

    draw();

    await user.click(screen.getByRole('button', { name: 'Account' }));
    await screen.findByRole('menuitem', { name: 'My Account' });

    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('lights the page with the colour of what is being shown', () => {
    const { view } = draw({ moodLights: [{ color: '#5a3c8c', at: '20% 30%' }] });

    const bloom = view.container.querySelector<HTMLElement>('.valence-bloom');

    expect(bloom?.style.background).toContain('rgb(90, 60, 140)');
    expect(bloom?.style.background).toContain('20% 30%');
  });

  it('leaves room above every page for the bar laid over its top', () => {
    const { view } = draw();

    expect(view.container.querySelector('main')).toHaveClass('pt-[var(--nav-clearance)]');
  });

  it('ends the page with the content rather than with a second navigation', () => {
    const { view } = draw();

    expect(view.container.querySelector('footer')).toBeNull();
  });

  it('has no rail down the side to collapse', () => {
    draw();

    expect(screen.queryByRole('button', { name: /sidebar/i })).not.toBeInTheDocument();
  });

  it('keeps the dice a plain press where there is only one kind to choose from', async () => {
    const user = userEvent.setup();
    const onSurprise = vi.fn();

    draw({ onSurprise, libraryKinds: ['movies'] });

    await user.click(screen.getByRole('button', { name: 'Randomiser' }));

    expect(onSurprise).toHaveBeenCalledWith();
  });

  it('offers a choice of kind once the server holds more than one', async () => {
    const user = userEvent.setup();
    const onSurprise = vi.fn();

    draw({ onSurprise, libraryKinds: ['movies', 'shows'] });

    await user.click(screen.getByRole('button', { name: 'Choose something at random' }));

    expect(await screen.findByRole('menuitem', { name: 'Anything' })).toBeInTheDocument();
    expect(await screen.findByRole('menuitem', { name: 'A programme' })).toBeInTheDocument();

    await user.click(await screen.findByRole('menuitem', { name: 'A film' }));

    expect(onSurprise).toHaveBeenCalledWith('movies');
  });

  it('names only the kinds the server actually holds', async () => {
    const user = userEvent.setup();

    draw({ onSurprise: vi.fn(), libraryKinds: ['movies', 'shows'] });

    await user.click(screen.getByRole('button', { name: 'Choose something at random' }));

    await screen.findByRole('menuitem', { name: 'Anything' });

    expect(
      screen.queryByRole('menuitem', { name: 'Something to listen to' }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AppShell.displayName).toBe('AppShell');
  });
});

describe('the places the bar offers', () => {
  const offered = (): string[] =>
    ['Home', 'Shows', 'Films', 'Books', 'New & Popular', 'Favourites'].filter(
      (name) =>
        within(screen.getByRole('navigation', { name: 'Sections' })).queryByRole('button', {
          name,
        }) !== null,
    );

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('offers every place until it is known which of them hold anything', () => {
    draw();

    expect(offered()).toEqual(['Home', 'Shows', 'Films', 'Books']);
  });

  it('offers films, programmes and books only where they hold something', () => {
    draw({ stocked: ['films'] });

    expect(offered()).toEqual(['Home', 'Films']);
  });

  it('keeps the places that are never empty however little there is', () => {
    draw({ stocked: [] });

    expect(offered()).toEqual(['Home']);
  });

  it('fills the sheet in well before the page reaches the bar, so no hero shows through it', () => {
    Object.defineProperty(window, 'scrollY', { value: 32, configurable: true });

    const { view } = draw();

    expect(
      view.container
        .querySelector<HTMLElement>('.valence-shell')
        ?.style.getPropertyValue('--content-reach'),
    ).toBe('1');
  });

  it('fills it in proportion on the way there, rather than all at once', () => {
    Object.defineProperty(window, 'scrollY', { value: 16, configurable: true });

    const { view } = draw();

    expect(
      view.container
        .querySelector<HTMLElement>('.valence-shell')
        ?.style.getPropertyValue('--content-reach'),
    ).toBe('0.5');
  });

  it('says nothing has come up yet at the top of the page', () => {
    const { view } = draw();

    expect(
      view.container
        .querySelector<HTMLElement>('.valence-shell')
        ?.style.getPropertyValue('--content-reach'),
    ).toBe('0');
  });
});
