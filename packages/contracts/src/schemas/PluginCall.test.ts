import { describe, expect, it } from 'vitest';
import { PluginCallAnswerSchema, PluginCallSchema } from './PluginCall';

describe('a call to a plugin’s download client, and its answer', () => {
  it('reads a call by method, with whatever it asks', () => {
    expect(
      PluginCallSchema.parse({
        id: '6f1c3c43-3a8e-4f5b-9f39-2f9f0d6c1a11',
        pluginId: 'example-files',
        clientId: 'files',
        method: 'status',
        ask: { ids: ['7'] },
      }).method,
    ).toBe('status');
  });

  it('reads an answer with the hosts its links may come from, or why there is none', () => {
    expect(
      PluginCallAnswerSchema.parse({
        ok: true,
        value: { id: '7' },
        linkHosts: ['*.files.example.com'],
      }),
    ).toEqual({ ok: true, value: { id: '7' }, linkHosts: ['*.files.example.com'] });
    expect(
      PluginCallAnswerSchema.parse({
        ok: false,
        problem: { code: null, message: 'Down.', values: {} },
      }).ok,
    ).toBe(false);
  });
});
