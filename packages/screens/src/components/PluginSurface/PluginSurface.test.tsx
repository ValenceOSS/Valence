import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginSurface } from './PluginSurface';
import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';

const EVERY_BLOCK: Surface = {
  title: 'Anime tracking',
  blocks: [
    { type: 'heading', text: 'Your lists' },
    { type: 'text', text: '<b>not bold</b>', tone: 'muted' },
    { type: 'notice', tone: 'warning', title: 'Heads up', text: 'Sync is paused.' },
    { type: 'notice', tone: 'success', text: 'All caught up.' },
    { type: 'row', label: 'Frieren', detail: 'Episode 12', badge: 'Watching', icon: 'tv' },
    {
      type: 'button',
      label: 'Import now',
      action: { id: 'import' },
      tone: 'primary',
      icon: 'download',
    },
    { type: 'toggle', field: 'push', label: 'Send progress', value: true, help: 'As you watch' },
    { type: 'textField', field: 'user', label: 'Username', value: 'marq', placeholder: 'You' },
    { type: 'textField', field: 'token', label: 'Token', isSecret: true },
    {
      type: 'select',
      field: 'list',
      label: 'List',
      value: 'watching',
      options: [
        { value: 'watching', label: 'Watching' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    { type: 'progress', label: 'Imported', value: 0.5 },
    { type: 'image', image: { kind: 'asset', name: 'logo.png' }, alt: 'AniList logo' },
    { type: 'link', label: 'Open AniList', url: 'https://anilist.co/user/marq' },
    { type: 'divider' },
    {
      type: 'section',
      title: 'Advanced',
      children: [{ type: 'toggle', field: 'adult', label: 'Include adult titles', value: false }],
    },
    {
      type: 'list',
      title: 'Recent',
      rows: [{ type: 'row', label: 'Dandadan', action: { id: 'open', payload: { id: 'd' } } }],
    },
  ],
};

describe('PluginSurface', () => {
  it('draws every building block with Valence’s own controls, and never reads text as markup', () => {
    renderInAnAddress(<PluginSurface pluginId="anilist" surface={EVERY_BLOCK} onAct={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Anime tracking' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your lists' })).toBeInTheDocument();
    expect(screen.getByText('<b>not bold</b>')).toBeInTheDocument();
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('All caught up.')).toBeInTheDocument();
    expect(screen.getByText('Frieren')).toBeInTheDocument();
    expect(screen.getByText('Watching', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Send progress' })).toBeChecked();
    expect(screen.getByLabelText('Username')).toHaveValue('marq');
    expect(screen.getByLabelText('Token')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('progressbar', { name: 'Imported' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'AniList logo' })).toHaveAttribute(
      'src',
      '/api/plugins/anilist/assets/logo.png',
    );
    expect(screen.getByRole('link', { name: 'Open AniList' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Include adult titles' })).not.toBeChecked();
    expect(screen.getByRole('button', { name: /Dandadan/u })).toBeInTheDocument();
  });

  it('sends every field somebody filled in with the press', async () => {
    const onAct = vi.fn();

    renderInAnAddress(<PluginSurface pluginId="anilist" surface={EVERY_BLOCK} onAct={onAct} />);

    await userEvent.clear(screen.getByLabelText('Username'));
    await userEvent.type(screen.getByLabelText('Username'), 'ada');
    await userEvent.click(screen.getByRole('switch', { name: 'Send progress' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Include adult titles' }));
    await userEvent.click(screen.getByRole('button', { name: /Import now/u }));

    expect(onAct).toHaveBeenCalledWith(
      { id: 'import' },
      { push: false, user: 'ada', token: '', list: 'watching', adult: true },
    );
  });

  it('sends a row’s own action when it is pressed', async () => {
    const onAct = vi.fn();

    renderInAnAddress(<PluginSurface pluginId="anilist" surface={EVERY_BLOCK} onAct={onAct} />);

    await userEvent.click(screen.getByRole('button', { name: /Dandadan/u }));

    expect(onAct.mock.calls[0]?.[0]).toEqual({ id: 'open', payload: { id: 'd' } });
  });

  it('keeps its buttons still while the plugin is answering', () => {
    renderInAnAddress(
      <PluginSurface pluginId="anilist" surface={EVERY_BLOCK} onAct={vi.fn()} isActing />,
    );

    expect(screen.getByRole('button', { name: /Import now/u })).toBeDisabled();
  });
});
