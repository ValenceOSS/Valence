import { profileHeaders } from '@ValenceClient/profiles/currentProfile';

/**
 * Marks episodes or films as watched through to the end for whoever is watching, or takes that back
 * — so something seen elsewhere, or long ago, stops being offered as next. Watched is recorded as
 * having reached the end, the same as finishing it would; unwatched forgets how far they got.
 *
 * @param items - What to mark, with how long each runs.
 * @param isWatched - Whether they have now watched them, or have not.
 * @throws Where the server would not record every one of them.
 */
const markWatched = async (
  items: readonly { id: string; durationSeconds: number }[],
  isWatched: boolean,
): Promise<void> => {
  const answers = await Promise.all(
    items.map((item) =>
      fetch(
        `/api/media/${item.id}/progress`,
        isWatched
          ? {
              method: 'PUT',
              headers: { 'content-type': 'application/json', ...profileHeaders() },
              body: JSON.stringify({
                positionSeconds: item.durationSeconds,
                durationSeconds: item.durationSeconds,
                isFinished: true,
              }),
            }
          : { method: 'DELETE', headers: profileHeaders() },
      ),
    ),
  );

  if (answers.some((answer) => !answer.ok)) {
    throw new Error(
      isWatched ? 'It could not be marked as watched.' : 'It could not be marked as unwatched.',
    );
  }
};

export { markWatched };
