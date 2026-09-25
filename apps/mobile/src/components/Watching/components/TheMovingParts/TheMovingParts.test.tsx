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
}: {
  segments?: MediaSegment[];
  areControlsDrawn?: boolean;
}) => {
  const player = useVideoPlayer({ uri: '/film' });

  return (
    <TheMovingParts
      player={player}
      segments={segments}
      cues={[]}
      subtitleOffset={0}
      areControlsDrawn={areControlsDrawn}
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

  it('skips to the end of the stretch from wherever the film has got to', async () => {
    theFakePlayer.currentTime = 405;

    const drawn = await render(<Playing segments={[AN_INTRO]} />);

    await userEvent.press(drawn.getByLabelText('Skip Intro'));

    expect(theFakePlayer.currentTime).toBe(500);
  });

  it('draws the controls only when asked to', async () => {
    const hidden = await render(<Playing />);

    expect(hidden.queryByLabelText('Stop watching')).toBeNull();

    const shown = await render(<Playing areControlsDrawn />);

    expect(shown.getByLabelText('Stop watching')).toBeTruthy();
  });
});
