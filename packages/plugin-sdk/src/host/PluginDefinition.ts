import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceActRequest } from '@ValenceSDK/surface/SurfaceActRequestSchema';
import type { z } from 'zod';
import type { AddAnswerSchema } from '@ValenceSDK/downloadClients/AddAnswerSchema';
import type { DownloadAsk } from '@ValenceSDK/downloadClients/DownloadAskSchema';
import type { FilesAnswerSchema } from '@ValenceSDK/downloadClients/FilesAnswerSchema';
import type { ReleaseIn } from '@ValenceSDK/downloadClients/ReleaseInSchema';
import type { StatusAnswerSchema } from '@ValenceSDK/downloadClients/StatusAnswerSchema';
import type { StatusAsk } from '@ValenceSDK/downloadClients/StatusAskSchema';
import type { TestAnswerSchema } from '@ValenceSDK/downloadClients/TestAnswerSchema';
import type { ResolveAnswerSchema } from '@ValenceSDK/sources/ResolveAnswerSchema';
import type { ResolveAsk } from '@ValenceSDK/sources/ResolveAskSchema';
import type { StreamsAnswerSchema } from '@ValenceSDK/sources/StreamsAnswerSchema';
import type { StreamsAsk } from '@ValenceSDK/sources/StreamsAskSchema';
import type { RouteAnswerSchema } from '@ValenceSDK/routes/RouteAnswerSchema';
import type { ValenceHost } from './ValenceHost';

type Viewer = { profileId: string; isAdmin: boolean; nodes: string[] };

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
  ) => Surface | void | Promise<Surface | void>;
};

type PluginEvent = {
  topic: string;
  occurredAt: string;
  accountId?: string | null;
  profileId: string | null;
  mediaId: string | null;
  positionSeconds: number | null;
  durationSeconds: number | null;
};

type WebhookRequest = {
  headers: Record<string, string>;
  body: string;
  receivedAt: string;
};

type HandlerContext = { valence: ValenceHost };

type RouteRequest = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query: Record<string, string[]>;
  headers: Record<string, string>;
  body: string;
  receivedAt: string;
};

type RouteContext = {
  valence: ValenceHost;
  person: { profileId: string; name: string } | null;
};

type RouteHandler = (
  context: RouteContext,
  request: RouteRequest,
) => Promise<z.input<typeof RouteAnswerSchema>>;

type DownloadClientHandler = {
  test: (context: HandlerContext) => Promise<z.input<typeof TestAnswerSchema>>;
  add: (context: HandlerContext, release: ReleaseIn) => Promise<z.input<typeof AddAnswerSchema>>;
  status: (context: HandlerContext, ask: StatusAsk) => Promise<z.input<typeof StatusAnswerSchema>>;
  files: (context: HandlerContext, ask: DownloadAsk) => Promise<z.input<typeof FilesAnswerSchema>>;
  remove: (context: HandlerContext, ask: DownloadAsk) => Promise<void>;
};

type SourceHandler = {
  streams: (
    context: HandlerContext,
    ask: StreamsAsk,
  ) => Promise<z.input<typeof StreamsAnswerSchema>>;
  resolve: (
    context: HandlerContext,
    ask: ResolveAsk,
  ) => Promise<z.input<typeof ResolveAnswerSchema>>;
};

type PluginDefinition = {
  pages?: Record<string, SurfaceHandler>;
  panels?: Record<string, SurfaceHandler>;
  schedules?: Record<string, (context: { valence: ValenceHost }) => Promise<void>>;
  events?: (event: PluginEvent, context: { valence: ValenceHost }) => Promise<void>;
  webhooks?: Record<
    string,
    (context: { valence: ValenceHost }, request: WebhookRequest) => Promise<void>
  >;
  downloadClients?: Record<string, DownloadClientHandler>;
  sources?: Record<string, SourceHandler>;
  routes?: Record<string, RouteHandler>;
  onUpgraded?: (
    context: { valence: ValenceHost },
    versions: { from: string; to: string },
  ) => Promise<void>;
  onAccountConnected?: (
    context: { valence: ValenceHost },
    connection: { profileId: string; provider: string },
  ) => Promise<void>;
};

export type {
  DownloadClientHandler,
  HandlerContext,
  PluginDefinition,
  SourceHandler,
  PluginEvent,
  RouteContext,
  RouteHandler,
  RouteRequest,
  SurfaceContext,
  SurfaceHandler,
  Viewer,
  WebhookRequest,
};
