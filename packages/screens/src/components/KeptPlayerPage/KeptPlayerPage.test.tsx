import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { KeptPlayerPage } from './KeptPlayerPage';
import type { HeldFile } from '@ValenceContracts/schemas/HeldFile';
import type * as Router from '@tanstack/react-router';
import type { VideoPlayerProps } from '@ValenceScreens/components/VideoPlayer/VideoPlayer.types';

const drawn = vi.hoisted((): { player: VideoPlayerProps | null } => ({ player: null }));

vi.mock('@ValenceScreens/components/VideoPlayer/VideoPlayer', () => ({
  VideoPlayer: (props: VideoPlayerProps) => {
    drawn.player = props;

    return <p>playing {props.media.title}</p>;
  },
}));

const back = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof Router>()),
  useParams: () => ({ downloadId: HERE.downloadId }),
  useRouter: () => ({ history: { back } }),
}));

const HERE: HeldFile = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original',
  durationSeconds: 6960,
  ofBytes: 4_000_000_000,
  state: 'here',
  bytes: 4_000_000_000,
  bytesPerSecond: null,
  failure: null,
  keptAt: '2026-01-01T00:20:00.000Z',
  hasPoster: false,
};

afterEach(() => {
  forgetPlatform();
});

describe('KeptPlayerPage', () => {
  it('plays the copy kept on this device in the ordinary player', async () => {
    installATestClient({ held: aFakeHeldFiles([HERE]).held });
    renderInAnAddress(<KeptPlayerPage />);

    expect(await screen.findByText('playing Arrival')).toBeInTheDocument();
    expect(drawn.player).toMatchObject({
      keptSource: `/held/${HERE.downloadId}`,
      isImmersive: true,
      media: { id: HERE.mediaId },
    });
  });

  it('says so, and offers the way back, where the copy is not here', async () => {
    installATestClient({ held: aFakeHeldFiles([]).held });
    renderInAnAddress(<KeptPlayerPage />);

    await userEvent.setup().click(await screen.findByRole('button', { name: /Go back/ }));

    expect(screen.getByText(/not on this device any more/)).toBeInTheDocument();
    expect(back).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(KeptPlayerPage.displayName).toBe('KeptPlayerPage');
  });
});
