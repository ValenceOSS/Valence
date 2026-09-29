import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginBlock } from './PluginBlock';

const common = { pluginId: 'p', fields: {}, onField: vi.fn(), onAct: vi.fn(), isActing: false };

describe('PluginBlock', () => {
  it('draws a text block in the tone asked for', () => {
    renderInAnAddress(
      <PluginBlock {...common} block={{ type: 'text', text: 'Failed', tone: 'danger' }} />,
    );

    expect(screen.getByText('Failed')).toHaveClass('text-danger');
  });

  it('tells its caller when a select changes', async () => {
    const onField = vi.fn();

    renderInAnAddress(
      <PluginBlock
        {...common}
        onField={onField}
        fields={{ list: 'a' }}
        block={{
          type: 'select',
          field: 'list',
          label: 'List',
          options: [
            { value: 'a', label: 'Alpha' },
            { value: 'b', label: 'Beta' },
          ],
        }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'List' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /Beta/u }));

    expect(onField).toHaveBeenCalledWith('list', 'b');
  });

  it('shows a picture from outside only through this server', () => {
    renderInAnAddress(
      <PluginBlock
        {...common}
        block={{
          type: 'image',
          image: { kind: 'remote', url: 'https://img.example/a.png' },
          alt: 'Cover',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Cover' }).getAttribute('src')).toMatch(
      /^\/api\/plugins\/p\/image\?url=/u,
    );
  });
});
