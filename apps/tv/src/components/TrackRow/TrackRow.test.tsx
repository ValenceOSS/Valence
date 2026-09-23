import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { TrackRow } from '@ValenceTv/components/TrackRow/TrackRow';

jest.mock('@ValenceTv/music/listenToTheSound', () => ({
  listenToTheSound: () => () => undefined,
}));

const TRACK = aTrack(1, { title: 'Look To Windward', durationSeconds: 463 });

describe('TrackRow', () => {
  it('names the song and who sings it', async () => {
    const drawn = await render(
      <TrackRow track={TRACK} place={0} isCurrent={false} isPlaying={false} onPress={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Look To Windward, Sleep Token' })).toBeOnTheScreen();
    expect(drawn.getByText('Look To Windward')).toBeOnTheScreen();
    expect(drawn.getByText('Sleep Token')).toBeOnTheScreen();
  });

  it('says where it comes in the list and how long it is', async () => {
    const drawn = await render(
      <TrackRow track={TRACK} place={4} isCurrent={false} isPlaying={false} onPress={jest.fn()} />,
    );

    expect(drawn.getByText('5')).toBeOnTheScreen();
    expect(drawn.getByText('7:43')).toBeOnTheScreen();
  });

  it('shows bars in place of its number while it is the song playing', async () => {
    const drawn = await render(
      <TrackRow track={TRACK} place={4} isCurrent isPlaying onPress={jest.fn()} />,
    );

    expect(drawn.queryByText('5')).toBeNull();
  });

  it('marks an explicit song', async () => {
    const drawn = await render(
      <TrackRow
        track={{ ...TRACK, isExplicit: true }}
        place={0}
        isCurrent={false}
        isPlaying={false}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('E · Sleep Token')).toBeOnTheScreen();
  });

  it('says which album it is from only when asked', async () => {
    const without = await render(
      <TrackRow track={TRACK} place={0} isCurrent={false} isPlaying={false} onPress={jest.fn()} />,
    );

    expect(without.queryByText('Even In Arcadia')).toBeNull();

    const withAlbum = await render(
      <TrackRow
        track={TRACK}
        place={0}
        isCurrent={false}
        isPlaying={false}
        showsAlbum
        onPress={jest.fn()}
      />,
    );

    expect(withAlbum.getByText('Even In Arcadia')).toBeOnTheScreen();
  });

  it('says where the chosen song comes', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <TrackRow track={TRACK} place={3} isCurrent={false} isPlaying={false} onPress={onPress} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Look To Windward, Sleep Token' }));

    expect(onPress).toHaveBeenCalledWith(3);
  });

  it('says where the song the remote is on comes, and turns white', async () => {
    const onFocus = jest.fn();
    const drawn = await render(
      <TrackRow
        track={TRACK}
        place={3}
        isCurrent={false}
        isPlaying={false}
        onPress={jest.fn()}
        onFocus={onFocus}
      />,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Look To Windward, Sleep Token' }), 'focus');

    expect(onFocus).toHaveBeenCalledWith(3);
    expect(drawn.getByText('Look To Windward')).toHaveStyle({ color: '#000000' });
  });
});
