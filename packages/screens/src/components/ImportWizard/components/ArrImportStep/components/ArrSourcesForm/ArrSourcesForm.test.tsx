import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ArrSourcesForm } from './ArrSourcesForm';

const ROWS = [
  { id: 1, kind: 'overseerr' as const, url: '', apiKey: '' },
  { id: 2, kind: 'radarr' as const, url: 'http://radarr:7878', apiKey: '' },
  { id: 3, kind: 'radarr' as const, url: '', apiKey: '' },
];

describe('ArrSourcesForm', () => {
  it('asks for each app’s address and key, and says what was typed', async () => {
    const onChange = vi.fn();

    render(
      <ArrSourcesForm
        rows={ROWS}
        isDisabled={false}
        onChange={onChange}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getAllByLabelText('Radarr address')[0]).toHaveValue('http://radarr:7878');

    await userEvent.type(screen.getByLabelText('Overseerr API key'), 'k');

    expect(onChange).toHaveBeenLastCalledWith(1, { apiKey: 'k' });
  });

  it('switches Overseerr for Jellyseerr', async () => {
    const onChange = vi.fn();

    render(
      <ArrSourcesForm
        rows={ROWS}
        isDisabled={false}
        onChange={onChange}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Jellyseerr' }));

    expect(onChange).toHaveBeenCalledWith(1, { kind: 'jellyseerr' });
  });

  it('removes an extra app of a kind, but never the first', async () => {
    const onRemove = vi.fn();

    render(
      <ArrSourcesForm
        rows={ROWS}
        isDisabled={false}
        onChange={vi.fn()}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const removers = screen.getAllByRole('button', { name: 'Remove Radarr' });

    expect(removers).toHaveLength(1);

    await userEvent.click(removers[0] ?? document.body);

    expect(onRemove).toHaveBeenCalledWith(3);
  });

  it('adds another app of a kind', async () => {
    const onAdd = vi.fn();

    render(
      <ArrSourcesForm
        rows={ROWS}
        isDisabled={false}
        onChange={vi.fn()}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Add another app' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Lidarr' }));

    expect(onAdd).toHaveBeenCalledWith('lidarr');
  });
});
