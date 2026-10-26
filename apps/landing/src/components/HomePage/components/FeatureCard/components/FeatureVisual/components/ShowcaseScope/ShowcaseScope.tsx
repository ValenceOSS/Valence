import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { aStillPlatform } from '@ValenceClient/platform/aStillPlatform';
import { installPlatform, platformIfAny } from '@ValenceClient/platform/installPlatform';
import type { ShowcaseScopeProps } from './ShowcaseScope.types';

/**
 * Lets the app's own components draw on the landing, with nothing behind them: a platform that keeps
 * nothing and reaches no server, and a cache of its own that never asks the server again, filled in
 * advance with whatever the picture shows.
 *
 * @param seed - Fills the cache with what the components inside will read.
 * @param children - The app's components to draw.
 */
const ShowcaseScope = ({ seed, children }: ShowcaseScopeProps) => {
  const [cache] = useState(() => {
    if (platformIfAny() === null) {
      installPlatform(aStillPlatform());
    }

    const made = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false, enabled: false } },
    });

    seed?.(made);

    return made;
  });

  return <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
};

ShowcaseScope.displayName = 'ShowcaseScope';

export { ShowcaseScope };
