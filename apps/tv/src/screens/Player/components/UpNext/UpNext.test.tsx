import { AccessibilityInfo, View } from 'react-native';
import { act, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { UpNext } from '@ValenceTv/screens/Player/components/UpNext/UpNext';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type Heard = (event: { eventType: string; eventKeyAction?: number }) => void;

const mockRemote = new Set<Heard>();

jest.mock('react-native/Libraries/Components/TV/TVEventHandler', () => ({
  __esModule: true,
  default: {
    addListener: (heard: Heard) => {
      mockRemote.add(heard);

      return {
        remove: () => {
          mockRemote.delete(heard);
        },
      };
    },
  },
}));

const press = (eventType: string) =>
  act(() => {
    for (const heard of mockRemote) {
      heard({ eventType, eventKeyAction: 1 });
    }
  });

const EPISODE: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000002',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: 'Fifth Episode',
  year: 2024,
  durationSeconds: 3000,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: 'show-1',
  seasonNumber: 2,
  episodeNumber: 5,
};

const OFFER = { secondsLeft: 21.4, counted: 0.4 };

describe('UpNext', () => {
  it('says what comes next, with its place and name', async () => {
    const drawn = await render(
      <UpNext
        episode={EPISODE}
        isAsking={false}
        offer={OFFER}
        onPlay={jest.fn()}
        onStay={jest.fn()}
      />,
    );

    expect(drawn.getByText('Next Episode')).toBeTruthy();
    expect(drawn.getByText('S2 E5 · Fifth Episode')).toBeTruthy();
  });

  it('leaves out the place of something not numbered', async () => {
    const drawn = await render(
      <UpNext
        episode={{ ...EPISODE, seasonNumber: null, episodeNumber: null }}
        isAsking={false}
        offer={OFFER}
        onPlay={jest.fn()}
        onStay={jest.fn()}
      />,
    );

    expect(drawn.getByText('Fifth Episode')).toBeTruthy();
  });

  it('starts it at once when Play Next is pressed', async () => {
    const onPlay = jest.fn();
    const drawn = await render(
      <UpNext
        episode={EPISODE}
        isAsking={false}
        offer={OFFER}
        onPlay={onPlay}
        onStay={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play Next' }));

    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('writes out the seconds left for somebody who asked for less motion', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    const drawn = await render(
      <UpNext
        episode={EPISODE}
        isAsking={false}
        offer={OFFER}
        onPlay={jest.fn()}
        onStay={jest.fn()}
      />,
    );

    await waitFor(() => {
      expect(drawn.getByText('Starts in 22 seconds')).toBeTruthy();
    });
  });

  it('asks whether anybody is still there rather than counting', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const onPlay = jest.fn();
    const drawn = await render(
      <UpNext episode={EPISODE} isAsking offer={OFFER} onPlay={onPlay} onStay={jest.fn()} />,
    );

    expect(drawn.getByText('Are you still watching?')).toBeTruthy();
    expect(drawn.queryByText(/Starts in/)).toBeNull();

    await userEvent.press(drawn.getByRole('button', { name: 'Keep watching' }));

    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('puts itself away and stays with the credits when asked to', async () => {
    const onStay = jest.fn();
    const drawn = await render(
      <UpNext
        episode={EPISODE}
        isAsking={false}
        offer={OFFER}
        onPlay={jest.fn()}
        onStay={onStay}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Watch Credits' }));

    expect(onStay).toHaveBeenCalledTimes(1);
  });

  describe('holding the remote', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    const drawn = async () => {
      const card = await render(
        <UpNext
          episode={EPISODE}
          isAsking={false}
          offer={OFFER}
          onPlay={jest.fn()}
          onStay={jest.fn()}
        />,
      );
      const play = card.getByRole('button', { name: 'Play Next' });
      const focus = jest.spyOn(View.prototype, 'requestTVFocus');

      return { card, play, focus };
    };

    it('hands the remote to Play Next as it arrives, where nothing on it has the remote', async () => {
      const { focus } = await drawn();

      await act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(focus).toHaveBeenCalled();
    });

    it('takes the remote back when it is pulled off both buttons', async () => {
      const { card, play, focus } = await drawn();

      await fireEvent(play, 'focus');
      await act(() => {
        jest.advanceTimersByTime(200);
      });
      focus.mockClear();

      await fireEvent(play, 'blur');
      await act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(focus).toHaveBeenCalledTimes(1);
      expect(card.getByRole('button', { name: 'Play Next' })).toBeTruthy();
    });

    it('leaves the remote alone as it moves from one button to the other', async () => {
      const { card, play, focus } = await drawn();

      await fireEvent(play, 'focus');
      await act(() => {
        jest.advanceTimersByTime(200);
      });
      focus.mockClear();

      await fireEvent(play, 'blur');
      await fireEvent(card.getByRole('button', { name: 'Watch Credits' }), 'focus');
      await act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(focus).not.toHaveBeenCalled();
    });

    it('leaves the remote alone where the television says the new button has it before the old one let go', async () => {
      const { card, play, focus } = await drawn();

      await fireEvent(play, 'focus');
      await act(() => {
        jest.advanceTimersByTime(200);
      });
      focus.mockClear();

      await fireEvent(card.getByRole('button', { name: 'Watch Credits' }), 'focus');
      await fireEvent(play, 'blur');
      await act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(focus).not.toHaveBeenCalled();
    });

    const askedFor = (focus: jest.SpyInstance) =>
      focus.mock.contexts.map(
        (view: { props: { accessibilityLabel?: string } }) => view.props.accessibilityLabel,
      );

    it('moves the remote to Watch Credits on right and back to Play Next on left', async () => {
      const { focus } = await drawn();

      await act(() => {
        jest.advanceTimersByTime(200);
      });
      focus.mockClear();

      await press('right');

      expect(askedFor(focus)).toContain('Watch Credits');

      focus.mockClear();
      await press('left');

      expect(askedFor(focus)).toContain('Play Next');
    });

    it('hands the remote back to the button it was last on when it is pulled away', async () => {
      const { card, focus } = await drawn();
      const credits = card.getByRole('button', { name: 'Watch Credits' });

      await fireEvent(credits, 'focus');
      focus.mockClear();

      await fireEvent(credits, 'blur');
      await act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(askedFor(focus)).toEqual(['Watch Credits']);
    });
  });
});
