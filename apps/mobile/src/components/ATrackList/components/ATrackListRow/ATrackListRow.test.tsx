import { render } from '@testing-library/react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { NOW_PLAYING } from '@ValenceMobile/components/ATrackList/NOW_PLAYING';
import { ATrackListRow } from './ATrackListRow';

/**
 * Draws one row under whatever is said to be playing.
 *
 * @param currentId - The song playing.
 * @returns The row, drawn.
 */
const drawRow = async (currentId: string | null) =>
  render(
    <NOW_PLAYING.Provider value={{ currentId, isPlaying: true }}>
      <ATrackListRow
        isFirst={false}
        track={aTrack(1)}
        at={0}
        number={1}
        artwork={null}
        isLiked={false}
        onPlay={jest.fn()}
        menuOf={() => []}
      />
    </NOW_PLAYING.Provider>,
  );

describe('ATrackListRow', () => {
  it('picks itself out where it is the song playing', async () => {
    const drawn = await drawRow(aTrack(1).id);

    expect(drawn.getByLabelText('Playing')).toBeTruthy();
  });

  it('is drawn plainly where another song is playing', async () => {
    const drawn = await drawRow(aTrack(2).id);

    expect(drawn.queryByLabelText('Playing')).toBeNull();
    expect(drawn.getByRole('button', { name: 'Play Track 1' })).toBeTruthy();
  });
});
