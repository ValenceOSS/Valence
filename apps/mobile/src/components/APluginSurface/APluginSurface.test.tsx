import { Linking } from 'react-native';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { APluginSurface } from './APluginSurface';

jest.mock('@ValenceClient/library/fetchLibrary', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchLibrary'),
  fetchMediaDetail: jest.fn(() => Promise.reject(new Error('Not asked'))),
}));

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'https://valence.test' }));
});

const surface = SurfaceSchema.parse({
  title: 'Anime tracking',
  blocks: [
    { type: 'heading', text: 'Your lists' },
    { type: 'text', text: '<b>not bold</b>', tone: 'muted' },
    { type: 'notice', tone: 'warning', title: 'Heads up', text: 'Sync runs hourly.' },
    { type: 'toggle', field: 'pushProgress', label: 'Send progress back', value: false },
    { type: 'textField', field: 'userName', label: 'User name', value: 'dan' },
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
    { type: 'divider' },
    {
      type: 'section',
      title: 'More',
      children: [{ type: 'link', label: 'Open AniList', url: 'https://anilist.co' }],
    },
    {
      type: 'list',
      title: 'Shows',
      rows: [{ type: 'row', label: 'Frieren', detail: '12 of 28', badge: 'Watching', icon: 'tv' }],
    },
    { type: 'button', label: 'Import now', action: { id: 'import' } },
  ],
});

describe('APluginSurface', () => {
  it('draws every block as plain words and parts of the phone', async () => {
    const drawn = await render(
      <APluginSurface pluginId="anilist" surface={surface} onAct={jest.fn()} />,
      {
        wrapper: CacheScope,
      },
    );

    expect(drawn.getByText('Anime tracking')).toBeTruthy();
    expect(drawn.getByText('<b>not bold</b>')).toBeTruthy();
    expect(drawn.getByText('Sync runs hourly.')).toBeTruthy();
    expect(drawn.getByText('Frieren')).toBeTruthy();
    expect(drawn.getAllByText('Watching')).toHaveLength(2);
    expect(drawn.getByRole('progressbar')).toBeTruthy();
  });

  it('sends every field as it stands with a press', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <APluginSurface pluginId="anilist" surface={surface} onAct={onAct} />,
      {
        wrapper: CacheScope,
      },
    );

    await fireEvent(drawn.getByLabelText('Send progress back'), 'valueChange', true);
    await userEvent.clear(drawn.getByDisplayValue('dan'));
    await userEvent.type(drawn.getByLabelText('User name'), 'marques');
    await userEvent.press(drawn.getByLabelText('Which list: Watching'));
    await userEvent.press(drawn.getByText('Completed'));
    await userEvent.press(drawn.getByText('Import now'));

    expect(onAct).toHaveBeenCalledWith(
      { id: 'import' },
      { pushProgress: true, userName: 'marques', list: 'completed' },
    );
  });

  it('opens a link in the browser', async () => {
    const opened = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const drawn = await render(
      <APluginSurface pluginId="anilist" surface={surface} onAct={jest.fn()} />,
      {
        wrapper: CacheScope,
      },
    );

    await userEvent.press(drawn.getByLabelText('Open AniList, opens in the browser'));

    expect(opened).toHaveBeenCalledWith('https://anilist.co');
  });

  it('starts its fields again when the plugin sends a new page', async () => {
    const onAct = jest.fn();
    const drawn = await render(
      <APluginSurface pluginId="anilist" surface={surface} onAct={onAct} />,
      {
        wrapper: CacheScope,
      },
    );

    await fireEvent(drawn.getByLabelText('Send progress back'), 'valueChange', true);

    const next = SurfaceSchema.parse({
      blocks: [
        { type: 'toggle', field: 'pushProgress', label: 'Send progress back', value: false },
        { type: 'button', label: 'Save', action: { id: 'save' } },
      ],
    });

    await drawn.rerender(<APluginSurface pluginId="anilist" surface={next} onAct={onAct} />);
    await userEvent.press(drawn.getByText('Save'));

    expect(onAct).toHaveBeenLastCalledWith({ id: 'save' }, { pushProgress: false });
  });
});
