import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createNoEmailBlock } from './createNoEmailBlock';

const anApp = () => {
  const app = new Hono();

  app.use('/api/auth/*', createNoEmailBlock());
  app.all('/api/auth/*', async (context) => context.text(await context.req.text()));

  return app;
};

/**
 * Posts a body to a sign-in path.
 *
 * @param path - Where to post it.
 * @param body - What to send.
 * @returns The answer.
 */
const post = (path: string, body: object) =>
  anApp().request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('createNoEmailBlock', () => {
  it('will not sign in with a placeholder address', async () => {
    const answer = await post('/api/auth/sign-in/email', {
      email: 'abc@NO-EMAIL.invalid',
      password: 'whatever it is',
    });

    expect(answer.status).toBe(400);
  });

  it('will not change an address to a placeholder', async () => {
    const answer = await post('/api/auth/change-email', { newEmail: 'abc@no-email.invalid' });

    expect(answer.status).toBe(400);
  });

  it('passes a real address through with its body intact', async () => {
    const answer = await post('/api/auth/sign-in/email', { email: 'ada@example.com' });

    expect(answer.status).toBe(200);
    expect(await answer.text()).toContain('ada@example.com');
  });

  it('leaves a request without a body alone', async () => {
    const answer = await anApp().request('/api/auth/get-session');

    expect(answer.status).toBe(200);
  });
});
