import { readFromServer } from '@ValenceClient/query/readFromServer';
import { WayInSchema } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { WayInMessage } from '@ValenceContracts/schemas/WayInMessage';

type WayIn = {
  profiles: ViewerProfile[];
  splashscreen: string | null;
  message: WayInMessage | null;
};

/**
 * Everything the way in is drawn from: the faces to choose between, the picture the household
 * chose to be greeted with, and the message written for it, where it chose them.
 *
 * Asked of the same address as the faces, so the picture is shown exactly where they are — a server
 * that keeps who lives here to itself refuses this, and the way in falls back to its own ground.
 *
 * @returns The faces, where the picture is read from or nothing, and the message or nothing.
 */
const fetchWayIn = async (): Promise<WayIn> => {
  const answer = await readFromServer('/api/profiles/everyone', WayInSchema);

  return {
    profiles: answer.profiles,
    splashscreen: answer.splashscreen ?? null,
    message: answer.message ?? null,
  };
};

export type { WayIn };

export { fetchWayIn };
