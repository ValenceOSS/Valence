import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createApiKeyAuthBlock } from './createApiKeyAuthBlock';

const anApp = () => {
  const app = new Hono();

  app.use('/api/auth/*', createApiKeyAuthBlock());
  app.all('/api/auth/*', (context) => context.text('reached'));

  return app;
};

const withAKey = { headers: { 'x-api-key': 'a-key' } };

describe('createApiKeyAuthBlock', () => {
  it('will not let a key list the account’s sessions', async () => {
    const answer = await anApp().request('/api/auth/list-sessions', withAKey);

    expect(answer.status).toBe(403);
    expect(await answer.json()).toMatchObject({
      code: 'error.apiKey.aKeyCannotChangeHowItsAccount',
    });
  });

  it('will not let a key register a passkey', async () => {
    const answer = await anApp().request('/api/auth/passkey/generate-register-options', withAKey);

    expect(answer.status).toBe(403);
  });

  it('still tells a key whose session it is', async () => {
    const answer = await anApp().request('/api/auth/get-session', withAKey);

    expect(await answer.text()).toBe('reached');
  });

  it('leaves a request without a key alone', async () => {
    const answer = await anApp().request('/api/auth/list-sessions');

    expect(await answer.text()).toBe('reached');
  });
});
