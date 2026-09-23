import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Scrubber } from '@ValenceTv/screens/Player/components/Scrubber/Scrubber';
import type { Trickplay } from '@ValenceClient/playback/fetchTrickplay';

const TRICKPLAY: Trickplay = {
  width: 320,
  height: 180,
  thumbnails: [
    {
      startSeconds: 0,
      endSeconds: 60,
      sheetUrl: '/trickplay/0.jpg',
      x: 0,
      y: 0,
      width: 320,
      height: 180,
    },
  ],
};

const draw = (
  change: Partial<{
    position: number;
    duration: number;
    scrubAt: number | null;
    trickplay: Trickplay | null;
    onFocus: () => void;
    onBlur: () => void;
    onPress: () => void;
  }> = {},
) =>
  render(
    <Scrubber
      position={change.position ?? 60}
      duration={change.duration ?? 600}
      scrubAt={change.scrubAt ?? null}
      trickplay={change.trickplay ?? null}
      onFocus={change.onFocus ?? jest.fn()}
      onBlur={change.onBlur ?? jest.fn()}
      onPress={change.onPress ?? jest.fn()}
    />,
  );

type Drawn = Awaited<ReturnType<typeof draw>>;

const picturesIn = (drawn: Drawn) =>
  drawn.container.queryAll((node) => node.props.cachePolicy !== undefined);

const trackIn = (drawn: Drawn) =>
  drawn.container
    .queryAll(
      (node) => node.type === 'View' && node.props.style !== undefined && node.children.length >= 3,
    )
    .at(-1);

describe('Scrubber', () => {
  it('shows the time gone and the time left either side of the bar', async () => {
    const drawn = await draw();

    expect(drawn.getByRole('button', { name: 'Scrub' })).toBeTruthy();
    expect(drawn.getByText('1:00')).toBeTruthy();
    expect(drawn.getByText('−9:00')).toBeTruthy();
  });

  it('never shows less than nothing left', async () => {
    const drawn = await draw({ position: 700 });

    expect(drawn.getByText('−0:00')).toBeTruthy();
  });

  it('shows the time at the cursor, and the picture there, while scrubbing', async () => {
    const drawn = await draw({ scrubAt: 300, trickplay: TRICKPLAY });

    expect(drawn.getAllByText('5:00')).toHaveLength(2);
    expect(drawn.getByText('−5:00')).toBeTruthy();
    expect(picturesIn(drawn)).toHaveLength(1);
  });

  it('shows only the time at the cursor for a title without thumbnails', async () => {
    const drawn = await draw({ scrubAt: 300 });

    expect(drawn.getAllByText('5:00')).toHaveLength(2);
    expect(picturesIn(drawn)).toHaveLength(0);
  });

  it('shows no preview while not scrubbing', async () => {
    const drawn = await draw({ trickplay: TRICKPLAY });

    expect(drawn.getAllByText('1:00')).toHaveLength(1);
    expect(picturesIn(drawn)).toHaveLength(0);
  });

  it('says when the remote lands on it and leaves it, and when it is pressed', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const onPress = jest.fn();
    const drawn = await draw({ onFocus, onBlur, onPress });
    const bar = drawn.getByRole('button', { name: 'Scrub' });

    await fireEvent(bar, 'focus');
    await fireEvent(bar, 'blur');
    await userEvent.press(bar);

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('thickens the bar while the remote is on it', async () => {
    const drawn = await draw();

    expect(trackIn(drawn)).toHaveStyle({ height: 8 });

    await fireEvent(drawn.getByRole('button', { name: 'Scrub' }), 'focus');

    expect(trackIn(drawn)).toHaveStyle({ height: 14 });
  });

  it('fills the bar as far as playing has reached', async () => {
    const drawn = await draw({ position: 150, duration: 600 });
    const [gone] = trackIn(drawn)?.children ?? [];

    expect(gone).toHaveStyle({ flex: 0.25 });
  });

  it('fills a lighter stretch from where playing is to the cursor ahead of it', async () => {
    const drawn = await draw({ position: 150, duration: 600, scrubAt: 450 });
    const [gone, ahead] = trackIn(drawn)?.children ?? [];

    expect(gone).toHaveStyle({ flex: 0.25 });
    expect(ahead).toHaveStyle({ flex: 0.5 });
  });

  it('draws an empty bar for a title whose length is not known', async () => {
    const drawn = await draw({ position: 150, duration: 0 });
    const [gone] = trackIn(drawn)?.children ?? [];

    expect(gone).toHaveStyle({ flex: 0 });
  });
});
