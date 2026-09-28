import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginRow } from './PluginRow';

describe('PluginRow', () => {
  it('is only a line of text where it has nothing to do', () => {
    renderInAnAddress(
      <PluginRow
        pluginId="p"
        row={{ type: 'row', label: 'Frieren', detail: 'Ep 3' }}
        onAct={vi.fn()}
        isActing={false}
      />,
    );

    expect(screen.getByText('Frieren')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('is pressable, with its picture, where it has an action', async () => {
    const onAct = vi.fn();

    renderInAnAddress(
      <PluginRow
        pluginId="p"
        row={{
          type: 'row',
          label: 'Frieren',
          image: { kind: 'asset', name: 'f.png' },
          action: { id: 'open' },
        }}
        onAct={onAct}
        isActing={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Frieren/u }));

    expect(onAct).toHaveBeenCalledWith({ id: 'open' });
    expect(document.querySelector('img')?.getAttribute('src')).toBe('/api/plugins/p/assets/f.png');
  });
});
