import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseTheme, chosenTheme } from '@ValenceClient/shell/theme';
import { areDeviceNoticesOn } from '@ValenceClient/notifications/deviceNotices';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ProfileSettings } from './ProfileSettings';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileDraft } from './ProfileSettings.types';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { readPlaybackPreferences } from '@ValenceScreens/playback/playbackPreferences';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: false,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DRAFT: ProfileDraft = {
  name: PROFILE.name,
  colour: PROFILE.colour,
  avatar: PROFILE.avatar,
  askStillWatchingAfter: PROFILE.askStillWatchingAfter,
  showsWhatIamWatching: PROFILE.showsWhatIamWatching,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  theme: 'system',
  motion: 'system',
  pluginTheme: null,
  playsInTheBrowser: false,
  connections: 3,
  streamingFormat: 'hls',
  showsDesktopNotices: false,
  deviceWas: {
    theme: 'system',
    motion: 'system',
    pluginTheme: null,
    playsInTheBrowser: false,
    connections: 3,
    streamingFormat: 'hls',
    showsDesktopNotices: false,
  },
  photo: null,
};

beforeEach(() => {
  chooseTheme('system');
});

describe('ProfileSettings', () => {
  it('offers every theme there is, named the way the account menu names them', () => {
    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={vi.fn()} />);

    const themes = screen.getByRole('group', { name: 'Theme' });

    for (const name of ['System', 'Light', 'Dark']) {
      expect(within(themes).getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('puts a theme into the draft, for the save button to keep', async () => {
    const actor = userEvent.setup();
    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await actor.click(
      within(screen.getByRole('group', { name: 'Theme' })).getByRole('button', { name: 'Dark' }),
    );

    expect(onDraft).toHaveBeenCalledWith({ theme: 'dark' });
    expect(chosenTheme()).toBe('system');
  });

  it('writes a new name into the draft rather than saving it', async () => {
    const actor = userEvent.setup();
    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await actor.type(screen.getByLabelText('Display name'), '!');

    expect(onDraft).toHaveBeenCalledWith(expect.objectContaining({ name: 'Marques!' }));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfileSettings.displayName).toBe('ProfileSettings');
  });

  it('leaves Discord to its own panel, even in the desktop app', () => {
    installATestClient({ thisClientKind: () => 'desktop' });

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={vi.fn()} />);

    expect(screen.queryByText('Show what I’m playing on Discord')).not.toBeInTheDocument();
  });

  it('writes turning this computer’s notices on into the draft, in the desktop app', async () => {
    const onDraft = vi.fn();

    installATestClient({ thisClientKind: () => 'desktop' });

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    const notices = screen.getByRole('switch', { name: 'Desktop notifications' });

    expect(notices).not.toBeChecked();

    await userEvent.click(notices);

    expect(onDraft).toHaveBeenCalledWith({ showsDesktopNotices: true });
    expect(areDeviceNoticesOn()).toBe(false);
  });

  it('offers no desktop notices in a browser, which has its own way to be told', () => {
    installATestClient({ thisClientKind: () => 'browser' });

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={vi.fn()} />);

    expect(screen.queryByRole('switch', { name: 'Desktop notifications' })).not.toBeInTheDocument();
  });

  it('puts playing more films in this browser into the draft, where there is WebGPU', async () => {
    vi.stubGlobal('navigator', { ...navigator, gpu: {} });
    window.localStorage.clear();

    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Play more films in this browser' }));

    expect(onDraft).toHaveBeenCalledWith({ playsInTheBrowser: true });
    expect(readPlaybackPreferences().playsInTheBrowser).toBe(false);

    vi.unstubAllGlobals();
  });

  it('offers no browser player where there is no WebGPU to draw with', () => {
    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={vi.fn()} />);

    expect(
      screen.queryByRole('switch', { name: 'Play more films in this browser' }),
    ).not.toBeInTheDocument();
  });

  it('puts how this device streams into the draft', async () => {
    const actor = userEvent.setup();
    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await actor.click(
      within(screen.getByRole('group', { name: 'Connections per stream' })).getByRole('button', {
        name: '2',
      }),
    );
    await actor.click(
      within(screen.getByRole('group', { name: 'Streaming format' })).getByRole('button', {
        name: /DASH/u,
      }),
    );

    expect(onDraft).toHaveBeenCalledWith({ connections: 2 });
    expect(onDraft).toHaveBeenCalledWith({ streamingFormat: 'dash' });
    expect(readPlaybackPreferences().connections).toBe(3);
  });

  it('writes preferring the best copy into the draft', async () => {
    const onDraft = vi.fn();

    renderInAnAddress(<ProfileSettings profile={PROFILE} draft={DRAFT} onDraft={onDraft} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Prefer the best version' }));

    expect(onDraft).toHaveBeenCalledWith({ prefersBestCopy: true });
  });
});
