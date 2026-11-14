import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { createStreamMeter } from './createStreamMeter';

const appWith = (meter: ReturnType<typeof createStreamMeter>) => {
  const app = new Hono();

  app.use('/stream', meter.count);
  app.get('/stream', (context) => context.body(new Uint8Array(4_000), 200));
  app.post('/stream', (context) => context.body(new Uint8Array(9_000), 200));
  app.use('/missing', meter.count);
  app.get('/missing', (context) => context.text('gone', 404));

  return app;
};

describe('createStreamMeter', () => {
  it('says nothing until it has been sampled twice', () => {
    const meter = createStreamMeter();

    expect(meter.bytesPerSecond()).toBeNull();

    meter.sample(0);

    expect(meter.bytesPerSecond()).toBeNull();
  });

  it('counts the bytes sent in answer and says how fast they went', async () => {
    const meter = createStreamMeter();
    const app = appWith(meter);

    meter.sample(0);

    const answer = await app.request('/stream');

    expect((await answer.arrayBuffer()).byteLength).toBe(4_000);

    meter.sample(2_000);

    expect(meter.bytesPerSecond()).toBe(2_000);
  });

  it('counts neither what was not asked for with GET nor what was refused', async () => {
    const meter = createStreamMeter();
    const app = appWith(meter);

    meter.sample(0);
    await (await app.request('/stream', { method: 'POST' })).arrayBuffer();
    await (await app.request('/missing')).arrayBuffer();
    meter.sample(1_000);

    expect(meter.bytesPerSecond()).toBe(0);
  });

  it('gives every reader the same speed, however often it is read', async () => {
    const meter = createStreamMeter();
    const app = appWith(meter);

    meter.sample(0);
    await (await app.request('/stream')).arrayBuffer();
    meter.sample(1_000);

    expect(meter.bytesPerSecond()).toBe(4_000);
    expect(meter.bytesPerSecond()).toBe(4_000);
  });

  it('keeps the last speed when sampled again too soon', async () => {
    const meter = createStreamMeter();
    const app = appWith(meter);

    meter.sample(0);
    await (await app.request('/stream')).arrayBuffer();
    meter.sample(1_000);
    await (await app.request('/stream')).arrayBuffer();
    meter.sample(1_100);

    expect(meter.bytesPerSecond()).toBe(4_000);
  });
});
