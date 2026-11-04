import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PRE_TRANSCODE_TARGET,
  PRE_TRANSCODING_DEFAULTS,
} from '@ValenceContracts/schemas/PreTranscoding';
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
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
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
  ladder: settings.targets.map((target) => ({
    target,
    replacesOriginal: false,
    copiesMade: 4,
    bytesKept: 0,
    stillNeeded: 12,
    givenUp: 1,
  })),
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
  it('shows no settings until the saved ones are read, so the defaults are never taken for them', async () => {
    let answer: (status: PreTranscodingStatus) => void = () => {};

    fetchPreTranscodingMock.mockReturnValue(
      new Promise<PreTranscodingStatus>((resolve) => {
        answer = resolve;
      }),
    );
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
        }
      >
        <PreTranscodingCard libraries={LIBRARIES} />
      </QueryClientProvider>,
    );

    expect(screen.getByLabelText('Reading the pre-transcoding settings')).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();

    answer(statusOf(ON));

    expect(await screen.findAllByRole('switch')).not.toHaveLength(0);
  });

  it('says how far it has got and that it waits for quiet hours', async () => {
    draw();

    expect(await screen.findByText('Remaining')).toBeVisible();
    expect(screen.getByText('12')).toBeVisible();
    expect(screen.getByText('Waiting for quiet hours')).toBeVisible();
  });

  it('turns it on and saves the whole of it, without a save button', async () => {
    draw(PRE_TRANSCODING_DEFAULTS);

    await userEvent.click(await screen.findByRole('switch', { name: 'Pre-transcoding' }));

    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    await waitFor(
      () => {
        expect(savePreTranscodingMock).toHaveBeenCalledWith({
          ...PRE_TRANSCODING_DEFAULTS,
          isEnabled: true,
        });
      },
      { timeout: 8000 },
    );
  });

  it('works at any time when asked to', async () => {
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Any time' }));

    await waitFor(
      () => {
        expect(savePreTranscodingMock).toHaveBeenCalledWith({ ...ON, schedule: 'untilDone' });
      },
      { timeout: 8000 },
    );
  });

  it('starts from every film and series library when they are to be chosen', async () => {
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Choose' }));

    expect(screen.getByRole('checkbox', { name: /Films/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Shows/ })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: /Music/ })).toBeNull();
  });

  it('pauses at once, without waiting', async () => {
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Pause' }));

    expect(savePreTranscodingMock).toHaveBeenCalledWith({ ...ON, isPaused: true });
  });

  it('adds a version one step below the lowest, and saves the ladder', async () => {
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Add a version' }));

    await waitFor(
      () => {
        expect(savePreTranscodingMock).toHaveBeenCalledWith({
          ...ON,
          targets: [
            DEFAULT_PRE_TRANSCODE_TARGET,
            { ...DEFAULT_PRE_TRANSCODE_TARGET, quality: '720p' },
          ],
        });
      },
      { timeout: 8000 },
    );
  });

  it('asks before the original stops being kept, then says which version replaces it', async () => {
    draw();

    expect(await screen.findByRole('switch', { name: 'Keep the original' })).toBeChecked();

    await userEvent.click(screen.getByRole('switch', { name: 'Keep the original' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete originals' }));

    expect(screen.getByText('Replaces the original')).toBeVisible();
  });

  it('asks for the next copy now', async () => {
    runPreTranscodingNowMock.mockResolvedValue(true);
    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Start the next copy now' }));

    expect(runPreTranscodingNowMock).toHaveBeenCalled();
  });

  it('offers no pause or next copy while it is off', async () => {
    draw(PRE_TRANSCODING_DEFAULTS);

    await screen.findByRole('switch', { name: 'Pre-transcoding' });

    expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start the next copy now' })).toBeNull();
  });
});
