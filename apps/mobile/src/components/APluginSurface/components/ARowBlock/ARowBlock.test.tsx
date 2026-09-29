import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ARowBlock } from './ARowBlock';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'https://valence.test' }));
});

describe('ARowBlock', () => {
  it('draws a row with its picture from this server and presses it', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <ARowBlock
        pluginId="anilist"
        isActing={false}
        onAct={onAct}
        row={{
          type: 'row',
          label: 'Frieren',
          detail: '12 of 28',
          badge: 'Watching',
          image: { kind: 'remote', url: 'https://img.anili.st/frieren.jpg' },
          action: { id: 'open', payload: { id: '1' } },
        }}
      />,
    );

    expect(drawn.getByText('12 of 28')).toBeTruthy();
    expect(JSON.stringify(drawn.toJSON())).toContain(
      'https://valence.test/api/plugins/anilist/image?url=https%3A%2F%2Fimg.anili.st%2Ffrieren.jpg',
    );

    await userEvent.press(drawn.getByLabelText('Frieren'));

    expect(onAct).toHaveBeenCalledWith({ id: 'open', payload: { id: '1' } });
  });

  it('draws a row that does nothing as words alone', async () => {
    const drawn = await render(
      <ARowBlock
        pluginId="anilist"
        isActing={false}
        onAct={jest.fn()}
        row={{ type: 'row', label: 'Frieren', icon: 'tv' }}
      />,
    );

    expect(drawn.queryByRole('button')).toBeNull();
    expect(drawn.getByText('Frieren')).toBeTruthy();
  });
});
