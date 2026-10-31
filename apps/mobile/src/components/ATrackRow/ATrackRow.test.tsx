import { render, userEvent } from '@testing-library/react-native';
import { pickFromAMenu } from '@ValenceMobile/testing/pickFromAMenu';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { ATrackRow } from './ATrackRow';
import type { ATrackRowProps } from './ATrackRow.types';

/**
 * A row for a test, its third track third in the list.
 *
 * @param overrides - What differs.
 * @returns The row.
 */
const aRow = (overrides: Partial<ATrackRowProps> = {}) => (
  <ATrackRow
    track={aTrack(3)}
    at={2}
    number={3}
    artwork={null}
    isCurrent={false}
    isLiked={false}
    onPlay={jest.fn()}
    menuOf={() => []}
    {...overrides}
  />
);

describe('ATrackRow', () => {
  it('plays from its place when pressed, and offers what else to do from its menu', async () => {
    const onPlay = jest.fn();
    const onChoose = jest.fn();
    const menuOf = jest.fn(() => [{ id: 'next', label: 'Play next', onChoose }]);
    const drawn = await render(aRow({ onPlay, menuOf }));

    await userEvent.press(drawn.getByRole('button', { name: 'Play Track 3' }));
    await pickFromAMenu('Play next');

    expect(onPlay).toHaveBeenCalledWith(2);
    expect(menuOf).toHaveBeenCalledWith(2);
    expect(onChoose).toHaveBeenCalled();
  });

  it('likes the song from the segment beside its menu', async () => {
    const onLike = jest.fn();
    const drawn = await render(aRow({ onLike }));

    await userEvent.press(drawn.getByRole('button', { name: 'Like Track 3' }));

    expect(onLike).toHaveBeenCalledWith(2);
  });

  it('numbers its place in the album', async () => {
    const drawn = await render(aRow());

    expect(drawn.getByText('3')).toBeTruthy();
  });

  it('marks the song playing in place of its number', async () => {
    const drawn = await render(aRow({ isCurrent: true, isPlaying: true }));

    expect(drawn.getByLabelText('Playing')).toBeTruthy();
    expect(drawn.queryByText('3')).toBeNull();
  });
});
