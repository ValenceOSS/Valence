import { describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { PluginCall, PluginCallAnswer } from '@ValenceContracts/schemas/PluginCall';
import { relayPluginCalls } from './relayPluginCalls';

const CALL: PluginCall = {
  id: '6f1c3c43-3a8e-4f5b-9f39-2f9f0d6c1a11',
  pluginId: 'example-files',
  clientId: 'files',
  method: 'test',
  ask: {},
};

describe('relaying plugin calls from the requests service', () => {
  it('answers each call, posts the answer back, and reopens a stream that ends', async () => {
    let opened = 0;
    const posted: [string, PluginCallAnswer][] = [];
    const lost: string[] = [];
    const waited: number[] = [];

    await relayPluginCalls({
      stream: (onCall) => {
        opened += 1;
        onCall(CALL);

        return Promise.resolve(sayVerbatim(`closed ${opened.toString()}`));
      },
      answer: () => Promise.resolve({ ok: true, value: { version: '1.0' }, linkHosts: [] }),
      post: (id, answered) => {
        posted.push([id, answered]);

        return Promise.resolve(null);
      },
      onLost: (reason) => lost.push(reason.message),
      wait: (afterMs) => {
        waited.push(afterMs);

        return Promise.resolve();
      },
      retryMs: 5000,
      keepGoing: () => opened < 2,
    });
    await vi.waitFor(() => {
      expect(posted).toHaveLength(2);
    });

    expect(posted[0]).toEqual([CALL.id, { ok: true, value: { version: '1.0' }, linkHosts: [] }]);
    expect(lost).toEqual(['closed 1', 'closed 2']);
    expect(waited).toEqual([5000]);
  });

  it('carries on when an answer cannot be posted', async () => {
    let opened = 0;

    await expect(
      relayPluginCalls({
        stream: (onCall) => {
          opened += 1;
          onCall(CALL);

          return Promise.resolve(sayVerbatim('closed'));
        },
        answer: () => Promise.resolve({ ok: false, problem: sayVerbatim('Down.') }),
        post: () => Promise.reject(new Error('gone')),
        onLost: () => undefined,
        wait: () => Promise.resolve(),
        retryMs: 0,
        keepGoing: () => opened < 1,
      }),
    ).resolves.toBeUndefined();
  });
});
