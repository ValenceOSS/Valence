import type { Context, Hono } from 'hono';
import type { JellyfinCaller, JellyfinOrigin } from '@ValenceServer/jellyfin/JellyfinBackend';

type JellyfinEnv = {
  Variables: {
    origin: JellyfinOrigin;
    caller: JellyfinCaller | null;
    query: Record<string, string>;
  };
};

type JellyfinApp = Hono<JellyfinEnv>;

type JellyfinContext = Context<JellyfinEnv>;

export type { JellyfinApp, JellyfinContext, JellyfinEnv };
