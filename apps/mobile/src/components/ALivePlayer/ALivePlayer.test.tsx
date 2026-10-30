import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { watchLiveChannel } from '@ValenceClient/live/watchLiveChannel';
import { ALivePlayer } from './ALivePlayer';

jest.mock('@ValenceClient/live/watchLiveChannel', () => ({ watchLiveChannel: jest.fn() }));

jest.mock('@ValenceMobile/platform/turnThisPhoneSideways', () => ({
  turnThisPhoneSideways: () => () => undefined,
}));

const CHANNEL = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  sourceId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  number: null,
  name: 'Five',
  group: null,
  region: null,
  health: 'onAir' as const,
  checkedAt: null,
  hasLogo: false,
  isFavourite: false,
  isEmbedded: false,
};

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(watchLiveChannel).mockReturnValue(new Promise(() => undefined));
});

describe('ALivePlayer', () => {
  it('moves along the channels from either side of play, and leaves', async () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const onClose = jest.fn();
    const drawn = await render(
      <ALivePlayer
        channel={CHANNEL}
        onNow={null}
        upNext={null}
        now={Date.now()}
        onPrevious={onPrevious}
        onNext={onNext}
        onToggleFavourite={jest.fn()}
        onClose={onClose}
      />,
    );

    await userEvent.press(drawn.getByLabelText('Previous channel'));
    await userEvent.press(drawn.getByLabelText('Next channel'));
    await userEvent.press(drawn.getByLabelText('Stop watching'));

    expect(onPrevious).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
