/**
 * Narrows a programme's episodes to the ones somebody asked for, keeping the programme's own order,
 * and to every one of them where nobody narrowed it.
 *
 * An id that is not one of the programme's episodes is dropped rather than obeyed, so asking for a
 * programme cannot be used to reach a title outside it.
 *
 * @param episodes - Every episode the programme holds, in order.
 * @param mediaIds - The ones asked for, or nothing for all of them.
 * @returns The episodes to cost or prepare.
 */
const theEpisodesAskedFor = <Episode extends { id: string }>(
  episodes: readonly Episode[],
  mediaIds: readonly string[] | undefined,
): Episode[] => {
  if (mediaIds === undefined) {
    return [...episodes];
  }

  const wanted = new Set(mediaIds);

  return episodes.filter((episode) => wanted.has(episode.id));
};

export { theEpisodesAskedFor };
