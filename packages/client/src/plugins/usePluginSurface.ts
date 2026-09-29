import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { actOnPluginSurface } from '@ValenceClient/plugins/actOnPluginSurface';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import type { PluginPlace } from '@ValenceClient/plugins/PluginPlace';
import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';

type PluginSurfaceHost = {
  askToConfirm: (question: string) => Promise<boolean>;
  openOnServer: (path: string) => Promise<void>;
};

type PluginSurfaceState = {
  surface: Surface | undefined;
  isError: boolean;
  isActing: boolean;
  problem: string | null;
  act: (action: SurfaceAction, fields: Record<string, string | boolean>) => void;
  retry: () => void;
};

/**
 * One plugin page or panel: what the plugin drew, and how to press something on it. A press the
 * plugin marked as needing confirmation is confirmed first, in whatever way the client asks. Every
 * press goes to the server: where it answers with a page, that page replaces this one; where it
 * answers with somewhere to go, such as the sign-in page of an account being connected, which is
 * always an address on this server, the client opens it in its own way and the page is read again
 * afterwards.
 *
 * @param place - Which page or panel.
 * @param host - How this client asks somebody to confirm, and how it opens a page of the server.
 * @returns The page and the way to act on it.
 */
const usePluginSurface = (place: PluginPlace, host: PluginSurfaceHost): PluginSurfaceState => {
  const cache = useQueryClient();
  const query = pluginQueries.surface(place);
  const read = useQuery(query);
  const [isActing, setIsActing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const act = (action: SurfaceAction, fields: Record<string, string | boolean>) => {
    void (async () => {
      if (action.confirm !== undefined && !(await host.askToConfirm(action.confirm))) {
        return;
      }

      setIsActing(true);
      setProblem(null);

      try {
        const answer = await actOnPluginSurface(place, { action, fields });

        if (answer.kind === 'surface') {
          cache.setQueryData(query.queryKey, answer.surface);
        } else {
          if (answer.kind === 'navigate') {
            await host.openOnServer(answer.to);
          }

          await cache.invalidateQueries({ queryKey: query.queryKey });
        }
      } catch (failure) {
        setProblem(
          failure instanceof Error && failure.message !== ''
            ? failure.message
            : 'That did not work. Try again in a moment.',
        );
      } finally {
        setIsActing(false);
      }
    })();
  };

  return {
    surface: read.data,
    isError: read.isError,
    isActing,
    problem,
    act,
    retry: () => {
      void read.refetch();
    },
  };
};

export type { PluginSurfaceHost, PluginSurfaceState };

export { usePluginSurface };
