import { readFromServer } from '@ValenceClient/query/readFromServer';
import { WayInSchema } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type WayIn = {
  profiles: ViewerProfile[];
  splashscreen: string | null;
};

/**
 * Everything the way in is drawn from: the faces to choose between, and the picture the household
 * chose to be greeted with, where it chose one.
 *
 * Asked of the same address as the faces, so the picture is shown exactly where they are — a server
 * that keeps who lives here to itself refuses this, and the way in falls back to its own ground.
 *
 * @returns The faces, and where the picture is read from or nothing.
 */
const fetchWayIn = async (): Promise<WayIn> => {
  const answer = await readFromServer('/api/profiles/everyone', WayInSchema);

  return { profiles: answer.profiles, splashscreen: answer.splashscreen ?? null };
};

export type { WayIn };

export { fetchWayIn };
