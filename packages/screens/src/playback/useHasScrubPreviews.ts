import { useQuery } from '@tanstack/react-query';
import { fetchTrickplay } from '@ValenceClient/playback/fetchTrickplay';

const ASKED_AGAIN_AFTER_MS = 30_000;

/**
 * Says whether an item's scrub previews have been built, so a control that needs their frames is
 * only offered once there are some to show.
 *
 * @param mediaId - The item, or null where there is none yet.
 * @param isEnabled - Whether to ask at all, for a viewer who would not be offered the control anyway.
 * @returns Whether the previews are built.
 */
const useHasScrubPreviews = (mediaId: string | null, isEnabled: boolean): boolean => {
  const asked = useQuery({
    queryKey: ['scrubPreviews', mediaId],
    queryFn: () => fetchTrickplay(mediaId ?? ''),
    enabled: isEnabled && mediaId !== null,
    staleTime: ASKED_AGAIN_AFTER_MS,
  });

  return asked.data !== undefined && asked.data !== null;
};

export { useHasScrubPreviews };
