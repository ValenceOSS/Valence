import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { PluginSurface } from '@ValenceTv/components/PluginSurface/PluginSurface';
import type { ReactNode } from 'react';

const Scope = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const surface = SurfaceSchema.parse({
  title: 'Anime tracking',
  blocks: [
    { type: 'heading', text: 'Your lists' },
    { type: 'text', text: '<i>plain</i>', tone: 'danger' },
    { type: 'notice', tone: 'info', text: 'Sync runs hourly.' },
    { type: 'toggle', field: 'pushProgress', label: 'Send progress back', value: false },
    { type: 'textField', field: 'userName', label: 'User name', value: 'dan', isSecret: false },
    {
      type: 'select',
      field: 'list',
      label: 'Which list',
      value: 'watching',
      options: [
        { value: 'watching', label: 'Watching' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    { type: 'progress', label: 'Matched', value: 0.5 },
    { type: 'image', image: { kind: 'asset', name: 'banner.png' }, alt: 'The banner' },
    { type: 'link', label: 'AniList', url: 'https://anilist.co' },
    { type: 'divider' },
    {
      type: 'section',
      title: 'Shows',
      children: [
        { type: 'list', rows: [{ type: 'row', label: 'Frieren', badge: 'Watching', icon: 'tv' }] },
      ],
    },
    { type: 'button', label: 'Import now', icon: 'download', action: { id: 'import' } },
  ],
});

describe('PluginSurface', () => {
  it('draws every block with the television’s own parts, as plain words', async () => {
    const drawn = await render(
      <PluginSurface pluginId="anilist" surface={surface} onAct={jest.fn()} />,
      {
        wrapper: Scope,
      },
    );

    expect(drawn.getByText('Anime tracking')).toBeTruthy();
    expect(drawn.getByText('<i>plain</i>')).toBeTruthy();
    expect(drawn.getByText('Sync runs hourly.')).toBeTruthy();
    expect(drawn.getByText('AniList: open this on your phone or on the web')).toBeTruthy();
    expect(drawn.getByLabelText('The banner')).toBeTruthy();
    expect(drawn.getByText('Frieren')).toBeTruthy();
  });

  it('switches, steps through a choice, and sends every field with a press', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <PluginSurface pluginId="anilist" surface={surface} onAct={onAct} />,
      {
        wrapper: Scope,
      },
    );

    await userEvent.press(drawn.getByText('Send progress back'));
    await fireEvent.changeText(drawn.getByDisplayValue('dan'), 'marques');
    await userEvent.press(drawn.getByText('Which list'));
    await userEvent.press(drawn.getByText('Import now'));

    expect(onAct).toHaveBeenCalledWith(
      { id: 'import' },
      { pushProgress: true, userName: 'marques', list: 'completed' },
    );
  });

  it('starts its fields again when the plugin sends a new page', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <PluginSurface pluginId="anilist" surface={surface} onAct={onAct} />,
      {
        wrapper: Scope,
      },
    );

    await userEvent.press(drawn.getByText('Send progress back'));
    await drawn.rerender(
      <PluginSurface
        pluginId="anilist"
        surface={SurfaceSchema.parse({
          blocks: [{ type: 'button', label: 'Save', action: { id: 'save' } }],
        })}
        onAct={onAct}
      />,
    );
    await userEvent.press(drawn.getByText('Save'));

    expect(onAct).toHaveBeenLastCalledWith({ id: 'save' }, {});
  });
});
