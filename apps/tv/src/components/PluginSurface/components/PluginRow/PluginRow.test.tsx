import { render, userEvent } from '@testing-library/react-native';
import { PluginRow } from '@ValenceTv/components/PluginSurface/components/PluginRow/PluginRow';

describe('PluginRow', () => {
  it('lets the remote press a row that does something', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <PluginRow
        pluginId="anilist"
        onAct={onAct}
        row={{
          type: 'row',
          label: 'Frieren',
          detail: '12 of 28',
          image: { kind: 'asset', name: 'frieren.png' },
          action: { id: 'open' },
        }}
      />,
    );

    expect(drawn.getByText('12 of 28')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Frieren'));

    expect(onAct).toHaveBeenCalledWith({ id: 'open' });
  });

  it('draws a row that does nothing as words the remote passes by', async () => {
    const drawn = await render(
      <PluginRow
        pluginId="anilist"
        onAct={jest.fn()}
        row={{ type: 'row', label: 'Frieren', badge: 'Watching', icon: 'tv' }}
      />,
    );

    expect(drawn.queryByLabelText('Frieren')).toBeNull();
    expect(drawn.getByText('Watching')).toBeTruthy();
  });
});
