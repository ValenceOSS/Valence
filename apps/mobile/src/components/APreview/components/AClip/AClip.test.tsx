import { act, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { theFakePlayer } from '@ValenceMobile/testing/theFakePlayer';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AClip } from './AClip';
import type { AClipProps } from './AClip.types';

const NOTHING_TOLD = () => undefined;

/**
 * A clip in the one player the tests share, drawn with whatever a test cares about.
 *
 * @param overrides - What matters to the test.
 */
const InAPlayer = (overrides: Partial<Omit<AClipProps, 'player'>>) => {
  const player = useVideoPlayer(null);

  return (
    <AClip
      player={player}
      isShowing
      isOnTop
      isMuted
      framing={null}
      held={null}
      onPlaying={NOTHING_TOLD}
      {...overrides}
    />
  );
};

/**
 * A clip drawn with whatever a test cares about.
 *
 * @param overrides - What matters to the test.
 * @returns The clip.
 */
const aClip = (overrides: Partial<Omit<AClipProps, 'player'>> = {}) => <InAPlayer {...overrides} />;

describe('AClip', () => {
  it('plays as soon as its clip has loaded', async () => {
    theFakePlayer.playing = false;
    await render(aClip());

    await act(() => {
      theFakePlayer.say('sourceLoad', { loaded: true });
    });

    expect(theFakePlayer.playing).toBe(true);
  });

  it('does not start a clip that loads once it is no longer showing', async () => {
    theFakePlayer.playing = false;
    await render(aClip({ isShowing: false }));

    await act(() => {
      theFakePlayer.say('sourceLoad', { loaded: true });
    });

    expect(theFakePlayer.playing).toBe(false);
  });

  it('says whether it is playing, and that it is not once it is no longer drawn', async () => {
    const onPlaying = jest.fn();
    const drawn = await render(aClip({ onPlaying }));

    await act(() => {
      theFakePlayer.say('playingChange', { isPlaying: true });
    });

    expect(onPlaying).toHaveBeenLastCalledWith(true);

    await drawn.unmount();

    expect(onPlaying).toHaveBeenLastCalledWith(false);
  });

  it('hands its player over while it plays, and nothing once it stops', async () => {
    const onClip = jest.fn();

    await render(aClip({ onClip }));
    await act(() => {
      theFakePlayer.say('playingChange', { isPlaying: true });
    });

    expect(onClip).toHaveBeenLastCalledWith(theFakePlayer);

    await act(() => {
      theFakePlayer.say('playingChange', { isPlaying: false });
    });

    expect(onClip).toHaveBeenLastCalledWith(null);
  });

  it('says when it has played through', async () => {
    const onEnded = jest.fn();

    await render(aClip({ onEnded }));
    await act(() => {
      theFakePlayer.say('playToEnd', { loaded: true });
    });

    expect(onEnded).toHaveBeenCalled();
  });

  it('stops at once where another page covers it', async () => {
    const drawn = await render(aClip());

    theFakePlayer.playing = true;
    await drawn.rerender(aClip({ isOnTop: false }));

    expect(theFakePlayer.playing).toBe(false);
  });

  it('fades out before it stops once it is no longer showing', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const drawn = await render(aClip());

    await act(() => {
      theFakePlayer.say('playingChange', { isPlaying: true });
    });
    await drawn.rerender(aClip({ isShowing: false }));

    expect(timing).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 0, useNativeDriver: true }),
    );
    timing.mockRestore();
  });

  it('zooms past the black bars it was measured with', async () => {
    await render(
      aClip({
        framing: { wide: 1920, high: 1080, top: 140, bottom: 140, left: 0, right: 0 },
        held: { wide: 390, high: 507 },
      }),
    );

    expect(JSON.stringify(theDrawnRoot().props.style)).toContain('"scale":');
  });

  it('is not zoomed where its picture already fills what holds it', async () => {
    await render(
      aClip({
        framing: { wide: 1920, high: 1080, top: 0, bottom: 0, left: 0, right: 0 },
        held: { wide: 390, high: 507 },
      }),
    );

    expect(JSON.stringify(theDrawnRoot().props.style)).not.toContain('"scale":');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AClip.displayName).toBe('AClip');
  });
});
