import { useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NO_BRAND } from '@ValenceContracts/schemas/Brand';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { applyBrand } from '@ValenceScreens/brand/applyBrand';

/**
 * Keeps the document wearing the server's own name, description, icon and accent, where an
 * administrator gave it them. Asked for before anybody has signed in, since the way in is the first
 * thing that should look like the server's own.
 */
const useAppliedBrand = (): void => {
  const { isOffline } = useOfflineMode();
  const asked = useQuery({ ...appearanceQueries.appearance(), enabled: !isOffline });
  const brand = asked.data?.brand ?? NO_BRAND;

  useLayoutEffect(() => {
    applyBrand(brand);
  }, [brand]);
};

export { useAppliedBrand };
