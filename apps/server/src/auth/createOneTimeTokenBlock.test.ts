import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createOneTimeTokenBlock } from './createOneTimeTokenBlock';

const anApp = () => {
  const app = new Hono();

  app.all('/api/auth/one-time-token/*', createOneTimeTokenBlock());
  app.all('/api/auth/*', (context) => context.text('reached'));

  return app;
};

describe('createOneTimeTokenBlock', () => {
  it('will not make a code for whatever sent a browser there', async () => {
    const answer = await anApp().request('/api/auth/one-time-token/generate');

    expect(answer.status).toBe(404);
  });

  it('will not spend a code for somebody who has only the code', async () => {
    const answer = await anApp().request('/api/auth/one-time-token/verify', { method: 'POST' });

    expect(answer.status).toBe(404);
  });

  it('leaves the rest of sign-in alone', async () => {
    const answer = await anApp().request('/api/auth/get-session');

    expect(await answer.text()).toBe('reached');
  });
});
