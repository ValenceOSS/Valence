import { act, render } from '@testing-library/react-native';
import { useVideoPlayer } from 'expo-video';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { readClipFraming } from '@ValenceClient/playback/readClipFraming';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { useArtworkSize } from '@ValenceMobile/hooks/useArtworkSize';
import { theFakePlayer } from '@ValenceMobile/testing/theFakePlayer';
import { APreview } from './APreview';
import type { AClipPlayer, APreviewProps } from './APreview.types';

const mockKeepsUp = { isTrue: true };

jest.mock('@ValenceMobile/platform/keepsUpWithPreviews', () => ({
  keepsUpWithPreviews: () => mockKeepsUp.isTrue,
}));

jest.mock('@ValenceClient/playback/readClipFraming', () => ({
  readClipFraming: jest.fn(() => Promise.resolve({ state: 'ready', framing: null })),
}));

jest.mock('@ValenceNative/motion/usePrefersStillness', () => ({
  usePrefersStillness: jest.fn(() => false),
}));

jest.mock('@ValenceMobile/hooks/useArtworkSize', () => ({
  useArtworkSize: jest.fn(() => 'whole'),
}));

/**
 * A preview handed a player shared with others, whose loading and letting go are watched.
 *
 * @param props - The preview, and what to tell of the shared player's use.
 */
const SharingAPlayer = ({
  load,
  letGo,
  ...props
}: APreviewProps & Pick<AClipPlayer, 'load' | 'letGo'>) => {
  const player = useVideoPlayer(null);

  return <APreview {...props} clipPlayer={{ player, source: null, load, letGo }} />;
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  mockKeepsUp.isTrue = true;
  jest.mocked(usePrefersStillness).mockReturnValue(false);
  jest.mocked(useArtworkSize).mockReturnValue('whole');
  jest.mocked(readClipFraming).mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('APreview', () => {
  it('shows the title’s backdrop behind its clip', async () => {
    const drawn = await render(
      <APreview mediaId="arrival" hasBackdrop isShowing={false} isMuted />,
      { wrapper: CacheScope },
    );

    expect(JSON.stringify(drawn.toJSON())).toContain(
      'http://one.local:8420/api/media/arrival/image/backdrop',
    );
  });

  it('asks for no backdrop until it knows which copy to ask for', async () => {
    jest.mocked(useArtworkSize).mockReturnValue(null);

    const drawn = await render(
      <APreview mediaId="arrival" hasBackdrop isShowing={false} isMuted />,
      { wrapper: CacheScope },
    );

    expect(JSON.stringify(drawn.toJSON())).not.toContain('image/backdrop');
  });

  it('asks for the backdrop narrowed to the screen, where the server narrows it that far', async () => {
    jest.mocked(useArtworkSize).mockReturnValue('large');

    const drawn = await render(
      <APreview mediaId="arrival" hasBackdrop isShowing={false} isMuted />,
      { wrapper: CacheScope },
    );

    expect(JSON.stringify(drawn.toJSON())).toContain(
      'http://one.local:8420/api/media/arrival/image/backdrop?size=large',
    );
  });

  it('says no clip is coming on a phone too slight to play one', async () => {
    mockKeepsUp.isTrue = false;
    const onFinding = jest.fn();

    await render(
      <APreview mediaId="arrival" hasBackdrop isShowing isMuted onFinding={onFinding} />,
      { wrapper: CacheScope },
    );

    expect(onFinding).toHaveBeenLastCalledWith('none');
  });

  it('draws only the backdrop, and asks for no clip, for somebody who wants less motion', async () => {
    jest.useFakeTimers();
    jest.mocked(usePrefersStillness).mockReturnValue(true);
    const onFinding = jest.fn();

    await render(
      <APreview mediaId="arrival" hasBackdrop isShowing isMuted onFinding={onFinding} />,
      { wrapper: CacheScope },
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expect(readClipFraming).not.toHaveBeenCalled();
    expect(onFinding).toHaveBeenLastCalledWith('none');
  });

  it('draws only the backdrop, and asks for no clip, where it is given no player', async () => {
    jest.useFakeTimers();

    const drawn = await render(
      <APreview mediaId="arrival" hasBackdrop isShowing isMuted clipPlayer={null} />,
      { wrapper: CacheScope },
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5000);
    });

    expect(readClipFraming).not.toHaveBeenCalled();
    expect(JSON.stringify(drawn.toJSON())).toContain('image/backdrop');
  });

  it('loads its clip into the player it shares once it has been showing a moment', async () => {
    jest.useFakeTimers();
    const load = jest.fn<void, Parameters<AClipPlayer['load']>>();
    const letGo = jest.fn<void, Parameters<AClipPlayer['letGo']>>();

    const drawn = await render(
      <SharingAPlayer mediaId="arrival" hasBackdrop isShowing isMuted load={load} letGo={letGo} />,
      { wrapper: CacheScope },
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(load).toHaveBeenCalledWith({ uri: 'http://one.local:8420/api/media/arrival/preview' });

    await drawn.rerender(
      <SharingAPlayer
        mediaId="arrival"
        hasBackdrop
        isShowing={false}
        isMuted
        load={load}
        letGo={letGo}
      />,
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1500);
    });

    expect(letGo).toHaveBeenCalledWith(load.mock.calls[0]?.[0]);
  });

  it('keeps the clip it holds, rather than loading it again, when shown again before letting go', async () => {
    jest.useFakeTimers();
    const load = jest.fn<void, Parameters<AClipPlayer['load']>>();
    const letGo = jest.fn<void, Parameters<AClipPlayer['letGo']>>();
    const shown = (isShowing: boolean) => (
      <SharingAPlayer
        mediaId="arrival"
        hasBackdrop
        isShowing={isShowing}
        isMuted
        load={load}
        letGo={letGo}
      />
    );

    const drawn = await render(shown(true), { wrapper: CacheScope });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });
    await drawn.rerender(shown(false));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(500);
    });
    await drawn.rerender(shown(true));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(load).toHaveBeenCalledTimes(1);
    expect(letGo).not.toHaveBeenCalled();
  });

  it('plays its clip in a player of its own where it is given none to share', async () => {
    jest.useFakeTimers();
    const onPlaying = jest.fn();
    const onFinding = jest.fn();

    await render(
      <APreview
        mediaId="arrival"
        hasBackdrop
        isShowing
        isMuted
        onPlaying={onPlaying}
        onFinding={onFinding}
      />,
      { wrapper: CacheScope },
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(theFakePlayer.source).toBe('http://one.local:8420/api/media/arrival/preview');

    await act(() => {
      theFakePlayer.say('playingChange', { isPlaying: true });
    });

    expect(onPlaying).toHaveBeenLastCalledWith(true);
    expect(onFinding).toHaveBeenLastCalledWith('found');
  });

  it('says no clip is coming where the server has none', async () => {
    jest.useFakeTimers();
    jest.mocked(readClipFraming).mockResolvedValueOnce({ state: 'absent', framing: null });
    const onFinding = jest.fn();

    await render(
      <APreview mediaId="arrival" hasBackdrop isShowing isMuted onFinding={onFinding} />,
      { wrapper: CacheScope },
    );
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000);
    });

    expect(onFinding).toHaveBeenLastCalledWith('none');
  });

  it('asks again how a clip from elsewhere is framed until it has been measured', async () => {
    jest.useFakeTimers();
    jest
      .mocked(readClipFraming)
      .mockResolvedValueOnce({ state: 'ready', framing: null })
      .mockResolvedValueOnce({ state: 'ready', framing: null })
      .mockResolvedValueOnce({
        state: 'ready',
        framing: { wide: 1920, high: 1080, top: 140, bottom: 140, left: 0, right: 0 },
      });

    await render(<APreview clip="/api/requests/trailer/1" isShowing isMuted />, {
      wrapper: CacheScope,
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(12_000);
    });

    expect(readClipFraming).toHaveBeenCalledTimes(3);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(APreview.displayName).toBe('APreview');
  });
});
