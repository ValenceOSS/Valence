import { render, userEvent, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchSession } from '@ValenceClient/session/auth';
import { aSessionUser } from '@ValenceMobile/testing/aSessionUser';
import { fetchPluginContributions } from '@ValenceClient/plugins/fetchPluginContributions';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import { fetchProfiles } from '@ValenceClient/profiles/fetchProfiles';
import { aProfile } from '@ValenceMobile/testing/aProfile';
import { fetchMyPermissions } from '@ValenceClient/session/fetchMyPermissions';
import { TheAccount } from './TheAccount';

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  fetchSession: jest.fn(),
}));

jest.mock('@ValenceClient/session/fetchMyPermissions');

jest.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: jest.fn(),
}));

jest.mock('@ValenceClient/profiles/fetchProfiles', () => ({
  ...jest.requireActual<object>('@ValenceClient/profiles/fetchProfiles'),
  fetchProfiles: jest.fn(),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchSession).mockResolvedValue(aSessionUser({ username: 'dan' }));
  jest.mocked(fetchPluginContributions).mockResolvedValue(somePluginContributions());
  jest.mocked(fetchProfiles).mockResolvedValue([aProfile({ name: 'Dan' })]);
  jest.mocked(fetchMyPermissions).mockResolvedValue({ permissions: [], isAdministrator: false });
});

/**
 * Draws the account tab with nothing listening but what the test hands it.
 *
 * @param handlers - What to tell when somebody leaves or opens a page.
 * @returns What was drawn.
 */
const theAccount = async (
  handlers: Partial<{
    onOut: () => void;
    onElsewhere: () => void;
    onOpen: (panel: string) => void;
  }> = {},
) =>
  render(
    <TheAccount
      onOut={handlers.onOut ?? jest.fn()}
      onElsewhere={handlers.onElsewhere ?? jest.fn()}
      onOpen={handlers.onOpen ?? jest.fn()}
    />,
    { wrapper: CacheScope },
  );

describe('TheAccount', () => {
  it('names whose account it is, without the username or the email address', async () => {
    const drawn = await theAccount();

    expect(await drawn.findByText('Dan')).toBeTruthy();
    expect(drawn.getByText('Edit profile')).toBeTruthy();
    expect(drawn.queryByText('@dan')).toBeNull();
    expect(drawn.queryByText('dan@example.com')).toBeNull();
  });

  it('opens each part of the account on a page of its own', async () => {
    const onOpen = jest.fn<void, [string]>();
    const drawn = await theAccount({ onOpen });

    await userEvent.press(await drawn.findByText('Edit profile'));
    await userEvent.press(drawn.getByText('Security'));
    await userEvent.press(drawn.getByText('Devices'));
    await userEvent.press(drawn.getByText('History'));
    await userEvent.press(drawn.getByText('Hidden'));
    await userEvent.press(drawn.getByText('Share links'));

    expect(onOpen.mock.calls.map(([panel]) => panel)).toEqual([
      'profile',
      'security',
      'devices',
      'history',
      'hidden',
      'shares',
    ]);
  });

  it('offers the pages plugins add, and opens them by their plugin and page', async () => {
    const onOpen = jest.fn();
    const drawn = await theAccount({ onOpen });

    await userEvent.press(await drawn.findByText('Anime tracking'));

    expect(onOpen).toHaveBeenCalledWith('plugin:anilist:tracking');
  });

  it('signs out, or moves to a different server', async () => {
    const onOut = jest.fn();
    const onElsewhere = jest.fn();
    const drawn = await theAccount({ onOut, onElsewhere });

    await userEvent.press(await drawn.findByText('Use a different server'));
    await userEvent.press(drawn.getByText('Sign out'));

    expect(onElsewhere).toHaveBeenCalled();
    expect(onOut).toHaveBeenCalled();
  });

  it('tells whoever is on a shared demo account that it is one', async () => {
    jest
      .mocked(fetchMyPermissions)
      .mockResolvedValue({ permissions: [], isAdministrator: false, isDemo: true });

    const drawn = await theAccount();

    expect(
      await drawn.findByText(
        'This is a shared demo account. Some settings are switched off, and anything you change is reset regularly.',
      ),
    ).toBeTruthy();
  });

  it('says nothing of a demo to any other account', async () => {
    const drawn = await theAccount();

    expect(await drawn.findByText('Dan')).toBeTruthy();
    await waitFor(() => {
      expect(fetchMyPermissions).toHaveBeenCalled();
    });

    expect(drawn.queryByText(/shared demo account/)).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TheAccount.displayName).toBe('TheAccount');
  });
});
