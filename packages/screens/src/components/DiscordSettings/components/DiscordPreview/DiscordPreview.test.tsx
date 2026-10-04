import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DiscordPreview } from './DiscordPreview';

const pickAgain = vi.hoisted(() => vi.fn());

const FILM = MediaSummarySchema.parse({
  id: '00000000-0000-4000-8000-0000000000c1',
  libraryId: '00000000-0000-4000-8000-0000000000b1',
  title: 'A Film',
  year: 2016,
  durationSeconds: 6000,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
});

vi.mock('./useDiscordSamples', () => ({
  useDiscordSamples: () => ({ film: FILM, episode: null, track: null, pickAgain }),
}));

beforeEach(() => {
  pickAgain.mockReset();
});

describe('DiscordPreview', () => {
  it('shows a film from the libraries as Discord’s profile card would', () => {
    renderInAnAddress(<DiscordPreview settings={DEFAULT_DISCORD_PRESENCE} />);

    expect(screen.getByText('Watching Valence')).toBeInTheDocument();
    expect(screen.getByText('A Film')).toBeInTheDocument();
  });

  it('switches to another state from the row above it', async () => {
    renderInAnAddress(<DiscordPreview settings={DEFAULT_DISCORD_PRESENCE} />);

    await userEvent.click(screen.getByRole('button', { name: 'Browsing' }));

    expect(screen.getByText('Browsing libraries')).toBeInTheDocument();
  });

  it('says nothing would show where the settings clear the status', async () => {
    renderInAnAddress(
      <DiscordPreview settings={{ ...DEFAULT_DISCORD_PRESENCE, showsBrowsing: false }} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Browsing' }));

    expect(screen.getByText('Nothing shows on Discord.')).toBeInTheDocument();
  });

  it('picks other titles when asked', async () => {
    renderInAnAddress(<DiscordPreview settings={DEFAULT_DISCORD_PRESENCE} />);

    await userEvent.click(screen.getByRole('button', { name: 'Randomise preview media' }));

    expect(pickAgain).toHaveBeenCalledOnce();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscordPreview.displayName).toBe('DiscordPreview');
  });
});
