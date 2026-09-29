import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceActRequest } from '@ValenceSDK/surface/SurfaceActRequestSchema';
import type { ValenceHost } from './ValenceHost';

type Viewer = { profileId: string; isAdmin: boolean };

type SurfaceContext = {
  valence: ValenceHost;
  viewer: Viewer;
  subject: { kind: 'title' | 'series' | 'album' | 'artist' | 'playlist'; id: string } | null;
};

type SurfaceHandler = {
  render: (context: SurfaceContext) => Surface | Promise<Surface>;
  act?: (
    context: SurfaceContext,
    request: SurfaceActRequest,
  ) => Surface | Promise<Surface> | void | Promise<void>;
};

type PluginEvent = {
  topic: string;
  occurredAt: string;
  profileId: string | null;
  mediaId: string | null;
};

type PluginDefinition = {
  pages?: Record<string, SurfaceHandler>;
  panels?: Record<string, SurfaceHandler>;
  schedules?: Record<string, (context: { valence: ValenceHost }) => Promise<void>>;
  events?: (event: PluginEvent, context: { valence: ValenceHost }) => Promise<void>;
  onUpgraded?: (
    context: { valence: ValenceHost },
    versions: { from: string; to: string },
  ) => Promise<void>;
  onAccountConnected?: (
    context: { valence: ValenceHost },
    connection: { profileId: string; provider: string },
  ) => Promise<void>;
};

export type { PluginDefinition, PluginEvent, SurfaceContext, SurfaceHandler, Viewer };
