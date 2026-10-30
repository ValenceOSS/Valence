import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { AChannelRow } from './AChannelRow';

const CHANNEL = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  sourceId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
  number: '5',
  name: 'Five',
  group: null,
  region: null,
  health: 'onAir' as const,
  checkedAt: null,
  hasLogo: false,
  isFavourite: false,
  isEmbedded: false,
};

const ON_NOW = {
  channelId: CHANNEL.id,
  startsAt: '2026-10-30T16:00:00.000Z',
  endsAt: '2026-10-30T17:00:00.000Z',
  title: 'The News',
  subtitle: null,
  description: null,
  category: null,
};

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('AChannelRow', () => {
  it('says what is on, plays the channel, and keeps it as a favourite', async () => {
    const onWatch = jest.fn();
    const onToggleFavourite = jest.fn();
    const drawn = await render(
      <AChannelRow
        channel={CHANNEL}
        onNow={ON_NOW}
        upNext={null}
        now={Date.parse('2026-10-30T16:30:00.000Z')}
        onWatch={onWatch}
        onToggleFavourite={onToggleFavourite}
      />,
    );

    expect(drawn.getByText(/The News/)).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Watch Five'));
    await userEvent.press(drawn.getByLabelText('Add Five to favourites'));

    expect(onWatch).toHaveBeenCalledWith(CHANNEL.id);
    expect(onToggleFavourite).toHaveBeenCalledWith(CHANNEL);
  });
});
