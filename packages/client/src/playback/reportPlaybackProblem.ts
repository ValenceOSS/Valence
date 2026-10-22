import type { PlaybackProblemReport } from '@ValenceContracts/schemas/PlaybackProblem';

/**
 * Tells the server what stopped something playing, so its admin hears about it without anybody
 * having to send them the details. Nothing waits on it, and a report that cannot be sent is let go:
 * the viewer already has the details to copy.
 *
 * @param report - What stopped, where, and the details a viewer would copy.
 * @param clientId - Which device is saying so.
 */
const reportPlaybackProblem = async (
  report: PlaybackProblemReport,
  clientId: string,
): Promise<void> => {
  await fetch(`/api/playback/problems?clientId=${encodeURIComponent(clientId)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(report),
  }).catch(() => undefined);
};

export { reportPlaybackProblem };
