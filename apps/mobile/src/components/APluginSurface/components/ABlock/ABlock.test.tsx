import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ABlock } from './ABlock';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'https://valence.test' }));
});

describe('ABlock', () => {
  it('draws a danger button and presses it', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <ABlock
        block={{
          type: 'button',
          label: 'Forget',
          tone: 'danger',
          icon: 'trash',
          action: { id: 'forget' },
        }}
        pluginId="anilist"
        fields={{}}
        onField={jest.fn()}
        onAct={onAct}
        isActing={false}
      />,
    );

    await userEvent.press(drawn.getByText('Forget'));

    expect(onAct).toHaveBeenCalledWith({ id: 'forget' });
  });

  it('draws a plugin picture from this server, described for somebody who cannot see it', async () => {
    const drawn = await render(
      <ABlock
        block={{
          type: 'image',
          image: { kind: 'asset', name: 'banner.png' },
          alt: 'The AniList banner',
        }}
        pluginId="anilist"
        fields={{}}
        onField={jest.fn()}
        onAct={jest.fn()}
        isActing={false}
      />,
    );

    expect(drawn.getByLabelText('The AniList banner')).toBeTruthy();
    expect(JSON.stringify(drawn.toJSON())).toContain(
      'https://valence.test/api/plugins/anilist/assets/banner.png',
    );
  });

  it('passes a toggle’s change up', async () => {
    const onField = jest.fn();
    const drawn = await render(
      <ABlock
        block={{ type: 'toggle', field: 'sync', label: 'Sync', value: false, help: 'Every hour' }}
        pluginId="anilist"
        fields={{ sync: false }}
        onField={onField}
        onAct={jest.fn()}
        isActing={false}
      />,
    );

    expect(drawn.getByText('Every hour')).toBeTruthy();

    await fireEvent(drawn.getByLabelText('Sync'), 'valueChange', true);

    expect(onField).toHaveBeenCalledWith('sync', true);
  });
});
