import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from './aServerAnswering';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('aServerAnswering', () => {
  it('answers every request with the same thing, and records what it was asked', async () => {
    const asked = aServerAnswering({ ok: true }, 201);
    const answer = await fetch('/api/x');

    expect(answer.status).toBe(201);
    expect(await answer.json()).toEqual({ ok: true });
    expect(asked.mock.calls[0]?.[0]).toBe('/api/x');
  });

  it('answers with nothing at all where asked to', async () => {
    aServerAnswering(null, 204);

    expect((await fetch('/api/x')).status).toBe(204);
  });
});
