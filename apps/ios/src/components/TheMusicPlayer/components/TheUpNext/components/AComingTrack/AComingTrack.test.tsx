import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { AComingTrack } from './AComingTrack';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AComingTrack', () => {
  it('skips to its place when pressed, and asks what else to do from its menu', async () => {
    const onPlay = jest.fn();
    const onMenu = jest.fn();
    const drawn = await render(
      <AComingTrack track={aTrack(4)} at={3} onPlay={onPlay} onMenu={onMenu} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play Track 4 now' }));
    await userEvent.press(drawn.getByRole('button', { name: 'More for Track 4' }));

    expect(onPlay).toHaveBeenCalledWith(3);
    expect(onMenu).toHaveBeenCalledWith(3, 'Track 4');
  });
});
