import { describe, expect, it } from 'vitest';
import { createPluginCallChannel } from './createPluginCallChannel';
import { createPluginCallRoutes } from './createPluginCallRoutes';

describe('the routes plugin calls travel by', () => {
  it('streams each call to the server, and takes the answer it posts back', async () => {
    const channel = createPluginCallChannel();
    const routes = createPluginCallRoutes({ channel, keepAliveMs: 10 });
    const closing = new AbortController();
    const response = await routes.request('/plugin-calls/stream', { signal: closing.signal });
    const reader = response.body?.getReader();

    await new Promise((resolve) => setTimeout(resolve, 5));

    const calling = channel.call('example-files', 'files', 'test', {});

    let text = '';

    while (!text.includes('\n\n') || !text.includes('data:')) {
      const read = await reader?.read();

      text += read?.value instanceof Uint8Array ? new TextDecoder().decode(read.value) : '';
    }

    const id = /"id":"([^"]+)"/.exec(text)?.[1] ?? '';
    const posted = await routes.request(`/plugin-calls/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ok: true, value: { version: '1.0' }, linkHosts: [] }),
      headers: { 'content-type': 'application/json' },
    });

    expect(posted.status).toBe(204);
    expect(await calling).toEqual({ value: { version: '1.0' }, linkHosts: [] });
    closing.abort();
  });

  it('refuses an answer nobody is waiting for, and one that is not an answer', async () => {
    const routes = createPluginCallRoutes({ channel: createPluginCallChannel() });
    const post = (body: object) =>
      routes.request('/plugin-calls/nobody', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      });

    expect((await post({ ok: true, value: null, linkHosts: [] })).status).toBe(404);
    expect((await post({ maybe: true })).status).toBe(400);
  });
});
