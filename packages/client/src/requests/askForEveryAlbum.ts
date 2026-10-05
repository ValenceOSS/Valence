import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';

/**
 * Asks for each of a set of albums, one after another as a person asking for each would, at one
 * quality for all of them where one was chosen.
 *
 * @param musicBrainzIds - Each album's release group, asked for once however often it is given.
 * @param profileId - The quality chosen, or nothing for the one the library asks at.
 * @returns How many were asked for, and how many were refused.
 */
const askForEveryAlbum = async (
  musicBrainzIds: readonly string[],
  profileId: string | null,
): Promise<{ asked: number; refused: number }> => {
  let asked = 0;
  let refused = 0;

  for (const musicBrainzId of new Set(musicBrainzIds)) {
    const sent = await askForMedia({
      kind: 'album',
      musicBrainzId,
      ...(profileId === null ? {} : { profileId }),
    });

    if (sent.value === null) {
      refused += 1;
    } else {
      asked += 1;
    }
  }

  return { asked, refused };
};

export { askForEveryAlbum };
