import { useQuery } from '@tanstack/react-query';
import { useServerHas } from '@ValenceClient/about/useServerHas';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

/**
 * The highest quality the account signed in may play at, and whether downloads are held to it too,
 * for a menu greying out what is above it before anybody picks it. Nothing is held back where the
 * server sets no such limit or cannot say.
 *
 * @returns The highest quality, or null for none, and whether downloads are held to it.
 */
const useQualityLimit = (): { maxQuality: QualityStepId | null; limitsDownloads: boolean } => {
  const isServed = useServerHas('streams.qualityLimit') === true;
  const limit = useQuery({ ...sessionQueries.streamLimit(), enabled: isServed });

  return {
    maxQuality: isServed ? (limit.data?.maxQuality ?? null) : null,
    limitsDownloads: isServed && limit.data?.limitsDownloads === true,
  };
};

export { useQualityLimit };
