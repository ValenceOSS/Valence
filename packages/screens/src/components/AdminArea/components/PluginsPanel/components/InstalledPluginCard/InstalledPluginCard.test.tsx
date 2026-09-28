import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aPlugin } from '@ValenceClient/testing/aPlugin';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { InstalledPluginCard } from './InstalledPluginCard';

const handlers = () => ({
  onToggle: vi.fn(),
  onSettings: vi.fn(),
  onUpdate: vi.fn(),
  onRemove: vi.fn(),
  onOpenPage: vi.fn(),
});

describe('InstalledPluginCard', () => {
  it('says how a plugin is getting on and offers its controls', async () => {
    const said = handlers();

    renderInAnAddress(
      <ul>
        <InstalledPluginCard
          plugin={aPlugin({
            updateAvailable: '1.1.0',
            pages: [{ id: 'log', title: 'Sync log', placement: 'admin' }],
            iconUrl: '/api/plugins/anilist/assets/icon.png',
          })}
          isBusy={false}
          {...said}
        />
      </ul>,
    );

    expect(screen.getByText('Official')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(document.querySelector('img')?.getAttribute('src')).toBe(
      '/api/plugins/anilist/assets/icon.png',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Update to 1.1.0' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sync log' }));
    await userEvent.click(screen.getByRole('button', { name: /Settings/u }));
    await userEvent.click(screen.getByRole('button', { name: /Remove/u }));
    await userEvent.click(screen.getByRole('switch', { name: 'Turn AniList off' }));

    expect(said.onUpdate).toHaveBeenCalled();
    expect(said.onOpenPage).toHaveBeenCalledWith({ pageId: 'log', title: 'Sync log' });
    expect(said.onSettings).toHaveBeenCalled();
    expect(said.onRemove).toHaveBeenCalled();
    expect(said.onToggle).toHaveBeenCalled();
  });

  it('marks an unsigned plugin, shows why one failed, and ignores a picture from elsewhere', () => {
    renderInAnAddress(
      <ul>
        <InstalledPluginCard
          plugin={aPlugin({
            trust: 'unsigned',
            state: 'failed',
            problem: 'It ran out of memory.',
            settings: [],
            iconUrl: 'https://evil.example/x.png',
          })}
          isBusy={false}
          {...handlers()}
        />
      </ul>,
    );

    expect(screen.getByText('Not signed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('It ran out of memory.')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
    expect(screen.queryByRole('button', { name: /Settings/u })).not.toBeInTheDocument();
  });
});
