import type { PlaybackNote } from '@ValenceContracts/schemas/PlaybackNote';

/**
 * Tells the server's log about something a player put right by itself, which otherwise leaves no
 * trace there. Nothing waits on it, and a note that cannot be sent is let go.
 *
 * @param note - What the player put right, and where.
 * @param clientId - Which device is saying so.
 */
const reportPlaybackNote = async (note: PlaybackNote, clientId: string): Promise<void> => {
  await fetch(`/api/playback/notes?clientId=${encodeURIComponent(clientId)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(note),
  }).catch(() => undefined);
};

export { reportPlaybackNote };
