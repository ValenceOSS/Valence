import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DiscordSettings } from './DiscordSettings';
import type { ProfileDraft } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

const fetchLibraries = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ fetchLibraries }));

vi.mock(
  '@ValenceScreens/components/DiscordSettings/components/DiscordPreview/useDiscordSamples',
  () => ({
    useDiscordSamples: () => ({ film: null, episode: null, track: null, pickAgain: vi.fn() }),
  }),
);

const FILMS = '00000000-0000-4000-8000-0000000000b1';

const DRAFT: ProfileDraft = {
  name: 'Dan',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: 'gilroy' },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: true,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  showsDesktopNotices: false,
  photo: null,
};

beforeEach(() => {
  fetchLibraries.mockReset().mockResolvedValue([
    { id: FILMS, name: 'Feature films', kind: 'movies' },
    { id: '00000000-0000-4000-8000-0000000000b2', name: 'Music', kind: 'music' },
  ]);
});

describe('DiscordSettings', () => {
  it('offers only the one switch while nothing is shown on Discord', async () => {
    const onDraft = vi.fn();

    renderInAnAddress(
      <DiscordSettings draft={{ ...DRAFT, showsWhatIamWatching: false }} onDraft={onDraft} />,
    );

    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Show what I’m playing on Discord' }));

    expect(onDraft).toHaveBeenCalledWith({ showsWhatIamWatching: true });
  });

  it('shows the preview and every setting once it is on', () => {
    renderInAnAddress(<DiscordSettings draft={DRAFT} onDraft={vi.fn()} />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('While paused')).toBeInTheDocument();
  });

  it('writes each choice into the draft rather than saving it', async () => {
    const onDraft = vi.fn();

    renderInAnAddress(<DiscordSettings draft={DRAFT} onDraft={onDraft} />);

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));

    expect(onDraft).toHaveBeenLastCalledWith({
      discordPresence: { ...DEFAULT_DISCORD_PRESENCE, logo: 'dark' },
    });

    await userEvent.click(screen.getByRole('switch', { name: 'Artwork' }));

    expect(onDraft).toHaveBeenLastCalledWith({
      discordPresence: { ...DEFAULT_DISCORD_PRESENCE, showsArtwork: false },
    });
  });

  it('lists only film and TV libraries to keep off Discord, and keeps one off when asked', async () => {
    const onDraft = vi.fn();

    renderInAnAddress(<DiscordSettings draft={DRAFT} onDraft={onDraft} />);

    const films = await screen.findByRole('switch', { name: 'Feature films' });

    expect(screen.queryAllByRole('switch', { name: 'Music' })).toHaveLength(1);

    await userEvent.click(films);

    await waitFor(() => {
      expect(onDraft).toHaveBeenLastCalledWith({
        discordPresence: { ...DEFAULT_DISCORD_PRESENCE, hiddenLibraryIds: [FILMS] },
      });
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscordSettings.displayName).toBe('DiscordSettings');
  });
});
