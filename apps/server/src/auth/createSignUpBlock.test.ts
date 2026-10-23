import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { createSignUpBlock } from './createSignUpBlock';

const anApp = () => {
  const app = new Hono();

  app.all('/api/auth/sign-up/*', createSignUpBlock());
  app.all('/api/auth/*', (context) => context.text('reached'));

  return app;
};

describe('createSignUpBlock', () => {
  it('will not make an account for whoever asks for one', async () => {
    const answer = await anApp().request('/api/auth/sign-up/email', { method: 'POST' });

    expect(answer.status).toBe(403);
    expect(await answer.json()).toMatchObject({
      code: 'error.account.accountsAreAddedByAnAdministrator',
    });
  });

  it('leaves signing in alone', async () => {
    const answer = await anApp().request('/api/auth/sign-in/email', { method: 'POST' });

    expect(await answer.text()).toBe('reached');
  });
});
