import { describe, expect, it } from 'vitest';
import { OpenAPIHono } from '@hono/zod-openapi';
import { countWhatIsStreamed } from './countWhatIsStreamed';
import { createStreamMeter } from './createStreamMeter';

const appWith = (meter: ReturnType<typeof createStreamMeter> | undefined) => {
  const app = new OpenAPIHono();

  countWhatIsStreamed(app, meter);
  app.get('/api/playback/:mediaId/file', (context) => context.body(new Uint8Array(1_000), 200));
  app.get('/api/playback/session/:sessionId/:name', (context) =>
    context.body(new Uint8Array(500), 200),
  );
  app.get('/api/admin/monitor', (context) => context.body(new Uint8Array(7_000), 200));

  return app;
};

describe('countWhatIsStreamed', () => {
  it('counts what viewers are sent to watch and nothing else', async () => {
    const meter = createStreamMeter();
    const app = appWith(meter);

    meter.sample(0);

    for (const path of [
      '/api/playback/abc/file',
      '/api/playback/session/s1/segment-3.m4s',
      '/api/admin/monitor',
    ]) {
      await (await app.request(path)).arrayBuffer();
    }

    meter.sample(1_000);

    expect(meter.bytesPerSecond()).toBe(1_500);
  });

  it('leaves every answer alone where nobody is counting', async () => {
    const answer = await appWith(undefined).request('/api/playback/abc/file');

    expect((await answer.arrayBuffer()).byteLength).toBe(1_000);
  });
});
