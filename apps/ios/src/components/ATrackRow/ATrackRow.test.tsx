import { render, userEvent } from '@testing-library/react-native';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { ATrackRow } from './ATrackRow';

const aRow = (overrides: Partial<Parameters<typeof ATrackRow>[0]> = {}) => (
  <ATrackRow
    track={aTrack(3)}
    number={3}
    artwork={null}
    isCurrent={false}
    isLiked={false}
    onPlay={jest.fn()}
    onMenu={jest.fn()}
    {...overrides}
  />
);

describe('ATrackRow', () => {
  it('plays the song when pressed, and asks what else to do from its menu', async () => {
    const onPlay = jest.fn();
    const onMenu = jest.fn();
    const drawn = await render(aRow({ onPlay, onMenu }));

    await userEvent.press(drawn.getByRole('button', { name: 'Play Track 3' }));
    await userEvent.press(drawn.getByRole('button', { name: /More/u }));

    expect(onPlay).toHaveBeenCalled();
    expect(onMenu).toHaveBeenCalled();
  });

  it('numbers its place in the album', async () => {
    const drawn = await render(aRow());

    expect(drawn.getByText('3')).toBeTruthy();
  });
});
