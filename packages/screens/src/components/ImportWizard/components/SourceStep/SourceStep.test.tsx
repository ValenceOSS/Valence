import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForArrivals } from '@ValenceScreens/testing/waitForArrivals';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { ConnectMediaImport, MediaImportSource } from '@ValenceContracts/schemas/MediaImport';
import { SourceStep } from './SourceStep';

const connectImportSource =
  vi.fn<(asked: ConnectMediaImport) => Promise<Answer<MediaImportSource>>>();
const forgetImportSource = vi.fn<(sourceId: string) => Promise<Answer<{ done: boolean }>>>();

vi.mock('@ValenceClient/imports/connectImportSource', () => ({
  connectImportSource: (asked: ConnectMediaImport) => connectImportSource(asked),
}));

vi.mock('@ValenceClient/imports/forgetImportSource', () => ({
  forgetImportSource: (sourceId: string) => forgetImportSource(sourceId),
}));

const DEN: MediaImportSource = {
  id: 'den',
  kind: 'jellyfin',
  name: 'Den',
  url: 'http://den:8096',
  version: '12.1.0',
  createdAt: '2026-10-02T00:00:00.000Z',
};

beforeEach(() => {
  connectImportSource.mockReset();
  forgetImportSource.mockReset().mockResolvedValue({ kind: 'answered', value: { done: true } });
});

describe('SourceStep', () => {
  it('says where to find the key for the server chosen', async () => {
    render(<SourceStep sources={[]} onConnected={vi.fn()} onForgotten={vi.fn()} />);

    expect(screen.getByLabelText('API key')).toHaveAccessibleDescription(
      /Dashboard, then API Keys/,
    );

    await userEvent.click(screen.getByRole('radio', { name: /Plex/ }));

    expect(screen.getByLabelText('Plex token')).toHaveAccessibleDescription(/X-Plex-Token/);

    await userEvent.click(screen.getByRole('radio', { name: /Emby/ }));

    expect(screen.getByLabelText('API key')).toHaveAccessibleDescription(/Advanced/);
  });

  it('connects the server, checking it, and goes on with it', async () => {
    const onConnected = vi.fn();

    connectImportSource.mockResolvedValue({ kind: 'answered', value: DEN });
    render(<SourceStep sources={[]} onConnected={onConnected} onForgotten={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Connect and check' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Address'), ' http://den:8096 ');
    await userEvent.type(screen.getByLabelText('API key'), 'key');
    await userEvent.click(screen.getByRole('button', { name: 'Connect and check' }));

    expect(connectImportSource).toHaveBeenCalledWith({
      kind: 'jellyfin',
      url: 'http://den:8096',
      token: 'key',
    });
    expect(onConnected).toHaveBeenCalledWith(DEN);
  });

  it('says why a server could not be connected', async () => {
    connectImportSource.mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'Jellyfin refused the key.' },
    });
    render(<SourceStep sources={[]} onConnected={vi.fn()} onForgotten={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Address'), 'http://den');
    await userEvent.type(screen.getByLabelText('API key'), 'bad');
    await userEvent.click(screen.getByRole('button', { name: 'Connect and check' }));

    expect(await screen.findByText('Jellyfin refused the key.')).toBeVisible();
  });

  it('carries on with a server connected before, or forgets it', async () => {
    const onConnected = vi.fn();
    const onForgotten = vi.fn();

    render(<SourceStep sources={[DEN]} onConnected={onConnected} onForgotten={onForgotten} />);
    await waitForArrivals();

    expect(screen.getByText('Den at http://den:8096')).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: 'Continue with this server' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConnected).toHaveBeenCalledWith(DEN);
    expect(forgetImportSource).toHaveBeenCalledWith('den');
    expect(onForgotten).toHaveBeenCalledWith('den');
  });
});
