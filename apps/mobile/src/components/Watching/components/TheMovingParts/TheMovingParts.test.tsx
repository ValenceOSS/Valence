import { DEFAULT_CAPTION_STYLE } from '@ValenceClient/playback/captionStyle';
import { act, render, userEvent } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { forgetTheFakePlayer, theFakePlayer } from '@ValenceMobile/testing/theFakePlayer';
import { TheMovingParts } from './TheMovingParts';
import type { MediaSegment } from '@ValenceClient/playback/fetchSegments';
import type { TheMovingPartsProps } from './TheMovingParts.types';

const AN_INTRO: MediaSegment = {
  kind: 'intro',
  startSeconds: 400,
  endSeconds: 500,
  source: 'manual',
};

const CREDITS: MediaSegment = {
  kind: 'credits',
  startSeconds: 1700,
  endSeconds: 1800,
  source: 'imported',
};

const controls = (): TheMovingPartsProps['controls'] => ({
  fade: new Animated.Value(1),
  title: 'A Film',
  year: 2024,
  isPlaying: true,
  trickplay: null,
  onPlayPause: jest.fn(),
  onSkip: jest.fn(),
  onTouched: jest.fn(),
  onClose: jest.fn(),
  onSettings: jest.fn(),
});

const Playing = ({
  segments = [],
  areControlsDrawn = false,
  onMoveTo = jest.fn(),
  next = null,
}: {
  segments?: MediaSegment[];
  areControlsDrawn?: boolean;
  onMoveTo?: (seconds: number) => void;
  next?: TheMovingPartsProps['next'];
}) => {
  const player = useVideoPlayer({ uri: '/film' });

  return (
    <TheMovingParts
      player={player}
      segments={segments}
      cues={[]}
      subtitleOffset={0}
      captionStyle={DEFAULT_CAPTION_STYLE}
      areControlsDrawn={areControlsDrawn}
      onMoveTo={onMoveTo}
      next={next}
      controls={controls()}
    />
  );
};

beforeEach(() => {
  forgetTheFakePlayer();
});

describe('TheMovingParts', () => {
  it('offers to skip once the film reaches a marked stretch', async () => {
    const drawn = await render(<Playing segments={[AN_INTRO]} />);

    expect(drawn.queryByLabelText('Skip Intro')).toBeNull();

    await act(() => {
      theFakePlayer.say('timeUpdate', {
        currentTime: 405,
        bufferedPosition: 420,
        currentLiveTimestamp: null,
        currentOffsetFromLive: null,
      });
    });

    expect(drawn.getByLabelText('Skip Intro')).toBeTruthy();
  });

  it('moves the film to the end of the stretch', async () => {
    theFakePlayer.currentTime = 405;
    const onMoveTo = jest.fn();

    const drawn = await render(<Playing segments={[AN_INTRO]} onMoveTo={onMoveTo} />);

    await userEvent.press(drawn.getByLabelText('Skip Intro'));

    expect(onMoveTo).toHaveBeenCalledWith(500);
  });

  it('offers the next episode in place of skipping credits that run to the end', async () => {
    theFakePlayer.currentTime = 1702;
    theFakePlayer.duration = 1800;
    const onPlay = jest.fn();

    const drawn = await render(
      <Playing segments={[CREDITS]} next={{ isCounting: true, isHeldAtTheEnd: false, onPlay }} />,
    );

    expect(drawn.queryByLabelText('Skip Credits')).toBeNull();

    await userEvent.press(drawn.getByText('Play Next'));

    expect(onPlay).toHaveBeenCalled();
  });

  it('skips the credits again for somebody staying for them', async () => {
    theFakePlayer.currentTime = 1702;
    theFakePlayer.duration = 1800;

    const drawn = await render(
      <Playing
        segments={[CREDITS]}
        next={{ isCounting: true, isHeldAtTheEnd: false, onPlay: jest.fn() }}
      />,
    );

    await userEvent.press(drawn.getByText('Watch Credits'));

    expect(drawn.queryByText('Play Next')).toBeNull();
    expect(drawn.getByLabelText('Skip Credits')).toBeTruthy();
  });

  it('offers the next episode again when held at the end, even after staying for the credits', async () => {
    theFakePlayer.currentTime = 1702;
    theFakePlayer.duration = 1800;

    const drawn = await render(
      <Playing
        segments={[CREDITS]}
        next={{ isCounting: true, isHeldAtTheEnd: false, onPlay: jest.fn() }}
      />,
    );

    await userEvent.press(drawn.getByText('Watch Credits'));

    expect(drawn.queryByText('Play Next')).toBeNull();

    theFakePlayer.currentTime = 1800;
    await drawn.rerender(
      <Playing
        segments={[CREDITS]}
        next={{ isCounting: false, isHeldAtTheEnd: true, onPlay: jest.fn() }}
      />,
    );

    expect(drawn.getByText('Play Next')).toBeTruthy();
  });

  it('offers the next episode again after somebody who stayed for the credits goes back and returns', async () => {
    theFakePlayer.currentTime = 1702;
    theFakePlayer.duration = 1800;

    const drawn = await render(
      <Playing
        segments={[CREDITS]}
        next={{ isCounting: true, isHeldAtTheEnd: false, onPlay: jest.fn() }}
      />,
    );

    await userEvent.press(drawn.getByText('Watch Credits'));

    expect(drawn.queryByText('Play Next')).toBeNull();

    await act(() => {
      theFakePlayer.say('timeUpdate', {
        currentTime: 1000,
        bufferedPosition: 1100,
        currentLiveTimestamp: null,
        currentOffsetFromLive: null,
      });
    });
    await act(() => {
      theFakePlayer.say('timeUpdate', {
        currentTime: 1702,
        bufferedPosition: 1750,
        currentLiveTimestamp: null,
        currentOffsetFromLive: null,
      });
    });

    expect(drawn.getByText('Play Next')).toBeTruthy();
  });

  it('keeps skipping the credits where there is no next episode', async () => {
    theFakePlayer.currentTime = 1702;
    theFakePlayer.duration = 1800;

    const drawn = await render(<Playing segments={[CREDITS]} />);

    expect(drawn.getByLabelText('Skip Credits')).toBeTruthy();
    expect(drawn.queryByText('Play Next')).toBeNull();
  });

  it('draws the controls only when asked to', async () => {
    const hidden = await render(<Playing />);

    expect(hidden.queryByLabelText('Stop watching')).toBeNull();

    const shown = await render(<Playing areControlsDrawn />);

    expect(shown.getByLabelText('Stop watching')).toBeTruthy();
  });
});
