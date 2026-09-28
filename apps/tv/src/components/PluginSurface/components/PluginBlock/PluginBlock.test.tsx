import { render, userEvent } from '@testing-library/react-native';
import { PluginBlock } from '@ValenceTv/components/PluginSurface/components/PluginBlock/PluginBlock';

describe('PluginBlock', () => {
  it('draws a danger button and presses it', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <PluginBlock
        block={{ type: 'button', label: 'Forget', tone: 'danger', action: { id: 'forget' } }}
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

  it('steps a choice on from its last option back to its first', async () => {
    const onField = jest.fn();
    const drawn = await render(
      <PluginBlock
        block={{
          type: 'select',
          field: 'list',
          label: 'Which list',
          options: [
            { value: 'watching', label: 'Watching' },
            { value: 'completed', label: 'Completed' },
          ],
        }}
        pluginId="anilist"
        fields={{ list: 'completed' }}
        onField={onField}
        onAct={jest.fn()}
        isActing={false}
      />,
    );

    await userEvent.press(drawn.getByText('Which list'));

    expect(onField).toHaveBeenCalledWith('list', 'watching');
  });

  it('says a switch is off where the page holds nothing for it', async () => {
    const drawn = await render(
      <PluginBlock
        block={{ type: 'toggle', field: 'sync', label: 'Sync', value: false }}
        pluginId="anilist"
        fields={{}}
        onField={jest.fn()}
        onAct={jest.fn()}
        isActing={false}
      />,
    );

    expect(drawn.getByText('Off')).toBeTruthy();
  });
});
