import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgressReporter } from './createProgressReporter';

const { reportWatchProgress } = vi.hoisted(() => ({ reportWatchProgress: vi.fn() }));

vi.mock('@ValenceClient/playback/watchProgress', () => ({ reportWatchProgress }));

const MEDIA_ID = '00000000-0000-4000-8000-000000000001';

beforeEach(() => {
  reportWatchProgress.mockReset();
  reportWatchProgress.mockResolvedValue(true);
});

describe('createProgressReporter', () => {
  it('tells the server where the viewer got to', async () => {
    await createProgressReporter(MEDIA_ID).report({ positionSeconds: 600, durationSeconds: 7200 });

    expect(reportWatchProgress).toHaveBeenCalledWith(
      MEDIA_ID,
      { positionSeconds: 600, durationSeconds: 7200, isFinished: false },
      { isLeaving: false },
    );
  });

  it('says nothing again while the position stands still, as it does when paused', async () => {
    const reporter = createProgressReporter(MEDIA_ID);

    await expect(reporter.report({ positionSeconds: 600, durationSeconds: 7200 })).resolves.toBe(
      true,
    );
    await expect(reporter.report({ positionSeconds: 600.4, durationSeconds: 7200 })).resolves.toBe(
      false,
    );
    await reporter.report({ positionSeconds: 600.4, durationSeconds: 7200 }, { isLeaving: true });

    expect(reportWatchProgress).toHaveBeenCalledTimes(1);
  });

  it('reports again once the position moves, backwards as well as forwards', async () => {
    const reporter = createProgressReporter(MEDIA_ID);

    await reporter.report({ positionSeconds: 600, durationSeconds: 7200 });
    await reporter.report({ positionSeconds: 610, durationSeconds: 7200 });
    await reporter.report({ positionSeconds: 120, durationSeconds: 7200 });

    expect(reportWatchProgress).toHaveBeenCalledTimes(3);
  });

  it('never reports the very beginning, which is what an empty player says', async () => {
    const reporter = createProgressReporter(MEDIA_ID);

    await reporter.report({ positionSeconds: 0, durationSeconds: 7200 });
    await reporter.report({ positionSeconds: 600, durationSeconds: Number.POSITIVE_INFINITY });
    await reporter.report({ positionSeconds: 600, durationSeconds: 0 });

    expect(reportWatchProgress).not.toHaveBeenCalled();
  });

  it('never writes over a saved place it started without knowing, until the viewer passes it', async () => {
    const reporter = createProgressReporter(MEDIA_ID, () => 3000);

    await reporter.report({ positionSeconds: 40, durationSeconds: 7200 });
    await reporter.report({ positionSeconds: 2999, durationSeconds: 7200 });

    expect(reportWatchProgress).not.toHaveBeenCalled();

    await reporter.report({ positionSeconds: 3010, durationSeconds: 7200 });
    await reporter.report({ positionSeconds: 120, durationSeconds: 7200 });

    expect(reportWatchProgress).toHaveBeenCalledTimes(2);
  });

  it('counts the credits as the end where they are marked', async () => {
    await createProgressReporter(MEDIA_ID).report({
      positionSeconds: 6600,
      durationSeconds: 7200,
      segments: [{ kind: 'credits', startSeconds: 6600, endSeconds: 7200, source: 'imported' }],
    });

    expect(reportWatchProgress).toHaveBeenCalledWith(
      MEDIA_ID,
      expect.objectContaining({ isFinished: true }),
      { isLeaving: false },
    );
  });

  it('asks for a request the browser will finish when the page is going away', async () => {
    await createProgressReporter(MEDIA_ID).report(
      { positionSeconds: 600, durationSeconds: 7200 },
      { isLeaving: true },
    );

    expect(reportWatchProgress).toHaveBeenCalledWith(MEDIA_ID, expect.anything(), {
      isLeaving: true,
    });
  });
});
