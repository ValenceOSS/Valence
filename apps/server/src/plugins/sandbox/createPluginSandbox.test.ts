import { describe, expect, it, vi } from 'vitest';
import { createPluginSandbox } from './createPluginSandbox';

const PLUGIN = { id: 'sandbox-test', version: '1.0.0' };

const CODE = `globalThis.valencePlugin = {
  pages: {
    home: {
      render: async ({ valence, viewer }) => {
        const said = await valence.storage.get('word');
        return { blocks: [{ type: 'text', text: said + ' ' + viewer.profileId }] };
      },
    },
    busy: { render: () => { while (true) {} } },
    nosy: { render: async () => ({ blocks: [{ type: 'text', text: [typeof require, typeof process].join(',') }] }) },
  },
};`;

describe('a plugin in a process of its own', () => {
  it('loads, answers through the broker, and stops when asked', async () => {
    const onHostCall = vi.fn<
      (method: string, args: string, scope: string | null) => Promise<string>
    >((method, args) =>
      Promise.resolve(method === 'storage.get' && args === '["word"]' ? '"hello"' : 'null'),
    );
    const sandbox = await createPluginSandbox({
      plugin: PLUGIN,
      code: CODE,
      methods: ['storage.get'],
      onHostCall,
    });

    const answer = await sandbox.invoke(
      'page.render',
      { id: 'home', viewer: { profileId: 'p1', isAdmin: false }, subject: null },
      'viewer-p1',
    );

    expect(JSON.parse(answer)).toEqual({ blocks: [{ type: 'text', text: 'hello p1' }] });
    expect(onHostCall).toHaveBeenCalledWith('storage.get', '["word"]', 'viewer-p1');

    const nosy = await sandbox.invoke('page.render', { id: 'nosy' }, 'scope');

    expect(nosy).toContain('undefined,undefined');

    sandbox.stop();
    expect(sandbox.isRunning()).toBe(false);
    await expect(sandbox.invoke('page.render', { id: 'home' }, 'scope')).rejects.toThrow(
      'not running',
    );
  }, 20_000);

  it('passes a refusal back to the plugin as an error', async () => {
    const sandbox = await createPluginSandbox({
      plugin: PLUGIN,
      code: `globalThis.valencePlugin = { pages: { home: { render: async ({ valence }) => {
        try { await valence.storage.get('x'); return { blocks: [] }; }
        catch (error) { return { blocks: [{ type: 'text', text: error.message }] }; }
      } } } };`,
      methods: ['storage.get'],
      onHostCall: () => Promise.reject(new Error('This plugin may not keep anything.')),
    });

    expect(await sandbox.invoke('page.render', { id: 'home' }, 'scope')).toContain(
      'may not keep anything',
    );
    sandbox.stop();
  }, 20_000);

  it('stops a plugin that never stops, and says so', async () => {
    const onStopped = vi.fn();
    const sandbox = await createPluginSandbox({
      plugin: PLUGIN,
      code: CODE,
      methods: ['storage.get'],
      onHostCall: () => Promise.resolve('null'),
      onStopped,
      limits: { cpuMilliseconds: 200 },
    });

    await expect(sandbox.invoke('page.render', { id: 'busy' }, 'scope')).rejects.toThrow(
      /interrupted/i,
    );
    await vi.waitFor(() => {
      expect(onStopped).toHaveBeenCalled();
    });
    expect(sandbox.isRunning()).toBe(false);
  }, 20_000);

  it('refuses a plugin whose code does not load', async () => {
    await expect(
      createPluginSandbox({
        plugin: PLUGIN,
        code: 'throw new Error("nope")',
        methods: [],
        onHostCall: () => Promise.resolve('null'),
      }),
    ).rejects.toThrow('nope');
  }, 20_000);

  it('gives up on an answer that never comes', async () => {
    const sandbox = await createPluginSandbox({
      plugin: PLUGIN,
      code: CODE,
      methods: ['storage.get'],
      onHostCall: () => new Promise(() => undefined),
      limits: { wallMilliseconds: 300 },
    });

    await expect(sandbox.invoke('page.render', { id: 'home' }, 'scope')).rejects.toThrow(
      'too long',
    );
    sandbox.stop();
  }, 20_000);
});
