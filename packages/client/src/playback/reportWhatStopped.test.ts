import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reportWhatStopped } from './reportWhatStopped';
import type { PlaybackProblemReport } from '@ValenceContracts/schemas/PlaybackProblem';

const sent = vi.hoisted(() => ({
  report: vi.fn<(report: PlaybackProblemReport, clientId: string) => Promise<void>>(),
}));

vi.mock('@ValenceClient/playback/reportPlaybackProblem', () => ({
  reportPlaybackProblem: sent.report,
}));

vi.mock('@ValenceClient/about/theBuildInfo', () => ({ theBuildInfo: () => null }));

const stopped = {
  cause: null,
  title: 'A film',
  positionSeconds: 12,
  how: null,
  sessionId: 'session-1',
  mediaId: 'media-1',
  clientId: 'phone-1',
};

beforeEach(() => {
  sent.report.mockReset();
});

describe('reportWhatStopped', () => {
  it('sends the code and the details a viewer would copy', () => {
    reportWhatStopped({ ...stopped, problem: 'damaged' });

    expect(sent.report).toHaveBeenCalledWith(
      expect.objectContaining({
        problem: 'damaged',
        mediaId: 'media-1',
        sessionId: 'session-1',
        positionSeconds: 12,
      }),
      'phone-1',
    );
    expect(sent.report.mock.calls.at(-1)?.[0].details).toContain('Error 101');
  });

  it('leaves out a problem that puts itself right', () => {
    reportWhatStopped({ ...stopped, problem: 'unreachable' });

    expect(sent.report).not.toHaveBeenCalled();
  });
});
