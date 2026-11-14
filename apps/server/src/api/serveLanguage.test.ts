import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';
import { createMemorySettingsStore } from '@ValenceServer/settings/createMemorySettingsStore';
import { ServerSettingsSchema } from '@ValenceServer/settings/ServerSettings';
import { createMemoryProfileService } from '@ValenceServer/profiles/createMemoryProfileService';
import type { Acting } from '@ValenceServer/profiles/acting/Acting';
import { serveLanguage } from './serveLanguage';

/**
 * A server whose administrator chose a language, with one account whose profile chose another.
 *
 * @param signedIn - Whether the profile is signed in and watching.
 * @returns The application.
 */
const aServer = async (signedIn: boolean): Promise<OpenAPIHono> => {
  const app = new OpenAPIHono();
  const settings = createMemorySettingsStore(
    ServerSettingsSchema.parse({
      trustedOrigins: [],
      cookieSecure: false,
      setupCompletedAt: null,
      language: 'de',
    }),
  );
  const profiles = createMemoryProfileService();
  const profile = await profiles.ensureDefault('a1', 'Ada');

  await profiles.rename('a1', profile.id, { name: 'Ada', colour: profile.colour, language: 'ja' });

  const acting: Acting = {
    account: { id: 'a1', name: 'Ada', email: 'ada@example.com' },
    sessionId: 's1',
    isViaKey: false,
    profile: { id: profile.id, name: 'Ada', isOwner: true, mayRequest: true },
    mustChoose: false,
  };

  serveLanguage(app, {
    settings,
    profiles,
    readActing: () => Promise.resolve(signedIn ? acting : null),
  });

  return app;
};

describe('serveLanguage', () => {
  it('tells somebody not signed in the server’s language alone', async () => {
    const answer = await (await aServer(false)).request('/api/language');

    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ server: 'de', profile: null });
  });

  it('tells the profile watching its own language beside the server’s', async () => {
    const answer = await (await aServer(true)).request('/api/language');

    expect(await answer.json()).toEqual({ server: 'de', profile: 'ja' });
    expect(answer.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
