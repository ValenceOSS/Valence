import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRE_TRANSCODING_DEFAULTS } from '@ValenceContracts/schemas/PreTranscoding';
import { PreTranscodingCard } from './PreTranscodingCard';
import type { Library } from '@ValenceContracts/schemas/Library';
import type {
  PreTranscodingSettings,
  PreTranscodingStatus,
} from '@ValenceContracts/schemas/PreTranscoding';

const fetchPreTranscodingMock = vi.hoisted(() => vi.fn());

const savePreTranscodingMock = vi.hoisted(() => vi.fn());

const runPreTranscodingNowMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchPreTranscoding', () => ({
  fetchPreTranscoding: fetchPreTranscodingMock,
}));
vi.mock('@ValenceClient/admin/savePreTranscoding', () => ({
  savePreTranscoding: savePreTranscodingMock,
}));
vi.mock('@ValenceClient/admin/runPreTranscodingNow', () => ({
  runPreTranscodingNow: runPreTranscodingNowMock,
}));

const ON: PreTranscodingSettings = { ...PRE_TRANSCODING_DEFAULTS, isEnabled: true };

const aLibrary = (id: string, name: string, kind: Library['kind']): Library => ({
  id,
  name,
  kind,
  path: `/media/${name}`,
  itemCount: 3,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
});

const LIBRARIES = [
  aLibrary('3f2504e0-4f89-41d3-9a0c-0305e82c3301', 'Films', 'movies'),
  aLibrary('3f2504e0-4f89-41d3-9a0c-0305e82c3302', 'Shows', 'shows'),
  aLibrary('3f2504e0-4f89-41d3-9a0c-0305e82c3303', 'Music', 'music'),
];

const statusOf = (settings: PreTranscodingSettings): PreTranscodingStatus => ({
  settings,
  copiesMade: 4,
  stillNeeded: 12,
  givenUp: 1,
  current: null,
  isInWindow: false,
  timezone: 'Europe/London',
});

beforeEach(() => {
  fetchPreTranscodingMock.mockReset();
  savePreTranscodingMock.mockReset();
  runPreTranscodingNowMock.mockReset();
  savePreTranscodingMock.mockImplementation((settings: PreTranscodingSettings) =>
    Promise.resolve(statusOf(settings)),
  );
});

/**
 * Draws the card with a cache of its own, over a server holding these settings.
 *
 * @param settings - What the server holds.
 */
const draw = (settings: PreTranscodingSettings = ON) => {
  fetchPreTranscodingMock.mockResolvedValue(statusOf(settings));

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <PreTranscodingCard libraries={LIBRARIES} />
    </QueryClientProvider>,
  );
};

describe('PreTranscodingCard', () => {
  it('says how far it has got and that it waits for quiet hours', async () => {
    draw();

    expect(await screen.findByText('Still to make')).toBeVisible();
    expect(screen.getByText('12')).toBeVisible();
    expect(screen.getByText('Waiting for quiet hours')).toBeVisible();
    expect(screen.getByText(/Europe\/London/)).toBeVisible();
  });

  it('turns it on and saves the whole of it', async () => {
    draw(PRE_TRANSCODING_DEFAULTS);

    await userEvent.click(await screen.findByRole('switch', { name: 'Pre-transcoding' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(savePreTranscodingMock).toHaveBeenCalledWith(ON);
  });

  it('saves a bitrate ceiling, and refuses to save one it cannot take', async () => {
    draw();

    const field = await screen.findByRole('spinbutton', { name: 'Bitrate ceiling' });

    await userEvent.type(field, '20');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await userEvent.type(field, '00');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(savePreTranscodingMock).toHaveBeenCalledWith({ ...ON, maxBitrateKbps: 2000 });
  });

  it('works until everything is done when asked to', async () => {
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Until everything is done' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(savePreTranscodingMock).toHaveBeenCalledWith({ ...ON, schedule: 'untilDone' });
  });

  it('offers only libraries of films and shows once every library is no longer wanted', async () => {
    draw();

    await userEvent.click(
      await screen.findByRole('checkbox', { name: /Every library of films and shows/ }),
    );

    expect(screen.getByRole('checkbox', { name: /Films/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Shows/ })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: /Music/ })).toBeNull();
  });

  it('pauses at once, without waiting for a save', async () => {
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Pause' }));

    expect(savePreTranscodingMock).toHaveBeenCalledWith({ ...ON, isPaused: true });
  });

  it('asks for the next copy now', async () => {
    runPreTranscodingNowMock.mockResolvedValue(true);
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Make the next copy now' }));

    expect(runPreTranscodingNowMock).toHaveBeenCalled();
  });

  it('offers no pause or next copy while it is off', async () => {
    draw(PRE_TRANSCODING_DEFAULTS);

    await screen.findByRole('switch', { name: 'Pre-transcoding' });

    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Make the next copy now' })).toBeNull();
  });
});
