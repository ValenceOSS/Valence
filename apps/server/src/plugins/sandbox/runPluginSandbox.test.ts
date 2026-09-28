import { describe, expect, it } from 'vitest';
import { runPluginSandbox } from './runPluginSandbox';
import { FromSandboxSchema } from './SandboxProtocol';
import type { FromSandbox, ToSandbox } from './SandboxProtocol';

type Harness = {
  tell: (message: ToSandbox) => void;
  next: (type: FromSandbox['type']) => Promise<FromSandbox>;
  heard: FromSandbox[];
  closedWith: () => number | null;
};

const start = async (): Promise<Harness> => {
  const heard: FromSandbox[] = [];
  const waiting: { type: FromSandbox['type']; resolve: (message: FromSandbox) => void }[] = [];

  let listener: ((text: string) => void) | null = null;
  let closed: number | null = null;

  await runPluginSandbox({
    send: (message) => {
      const read = FromSandboxSchema.parse(message);
      const waiter = waiting.findIndex((each) => each.type === read.type);

      if (waiter >= 0) {
        waiting.splice(waiter, 1)[0]?.resolve(read);
      } else {
        heard.push(read);
      }
    },
    listen: (given) => {
      listener = given;
    },
    close: (code) => {
      closed = code;
    },
  });

  return {
    tell: (message) => {
      listener?.(JSON.stringify(message));
    },
    next: (type) => {
      const already = heard.findIndex((each) => each.type === type);

      if (already >= 0) {
        return Promise.resolve(heard.splice(already, 1)[0] ?? { type: 'loaded' });
      }

      return new Promise((resolve) => {
        waiting.push({ type, resolve });
      });
    },
    heard,
    closedWith: () => closed,
  };
};

const load = (code: string): ToSandbox => ({
  type: 'load',
  code,
  plugin: { id: 'test-plugin', version: '1.0.0' },
  methods: ['storage.get', 'log.info'],
  memoryBytes: 16 * 1024 * 1024,
  cpuMilliseconds: 200,
});

const PAGE = `globalThis.valencePlugin = {
  pages: {
    home: {
      render: async ({ valence, viewer }) => {
        const saved = await valence.storage.get('greeting');
        return { title: valence.plugin.id, blocks: [{ type: 'text', text: saved + ' ' + viewer.profileId }] };
      },
      act: async (context, request) => ({ blocks: [{ type: 'text', text: request.action.id }] }),
    },
  },
  schedules: { tick: async ({ valence }) => { await valence.log.info('ticked'); } },
};`;

describe('the plugin sandbox', () => {
  it('loads a plugin, answers a render through a host call, and passes the viewer in', async () => {
    const sandbox = await start();

    sandbox.tell(load(PAGE));
    expect((await sandbox.next('loaded')).type).toBe('loaded');

    sandbox.tell({
      type: 'invoke',
      id: 1,
      handler: 'page.render',
      args: JSON.stringify({
        id: 'home',
        viewer: { profileId: 'p1', isAdmin: false },
        subject: null,
      }),
    });

    const call = await sandbox.next('hostCall');

    expect(call).toMatchObject({ method: 'storage.get', args: '["greeting"]', invocation: 1 });

    sandbox.tell({
      type: 'hostAnswer',
      id: call.type === 'hostCall' ? call.id : -1,
      ok: true,
      value: '"hello"',
    });

    const answer = await sandbox.next('answer');

    expect(answer).toMatchObject({ ok: true });
    expect(JSON.parse(answer.type === 'answer' ? (answer.value ?? '') : '')).toEqual({
      title: 'test-plugin',
      blocks: [{ type: 'text', text: 'hello p1' }],
    });
  });

  it('describes what the plugin provides', async () => {
    const sandbox = await start();

    sandbox.tell(load(PAGE));
    await sandbox.next('loaded');
    sandbox.tell({ type: 'invoke', id: 2, handler: 'describe', args: '{}' });

    const answer = await sandbox.next('answer');

    expect(JSON.parse(answer.type === 'answer' ? (answer.value ?? '') : '')).toEqual({
      pages: ['home'],
      panels: [],
      schedules: ['tick'],
      events: false,
      accountConnected: false,
    });
  });

  it('turns a refused host call into an error the plugin sees', async () => {
    const sandbox = await start();

    sandbox.tell(
      load(`globalThis.valencePlugin = { pages: { home: { render: async ({ valence }) => {
        try { await valence.storage.get('x'); return { blocks: [] }; }
        catch (error) { return { blocks: [{ type: 'text', text: error.message }] }; }
      } } } };`),
    );
    await sandbox.next('loaded');
    sandbox.tell({ type: 'invoke', id: 3, handler: 'page.render', args: '{"id":"home"}' });

    const call = await sandbox.next('hostCall');

    sandbox.tell({
      type: 'hostAnswer',
      id: call.type === 'hostCall' ? call.id : -1,
      ok: false,
      error: 'This plugin may not keep anything.',
    });

    const answer = await sandbox.next('answer');

    expect(answer.type === 'answer' ? answer.value : '').toContain(
      'This plugin may not keep anything.',
    );
  });

  it('gives plugin code nothing of Node or the network', async () => {
    const sandbox = await start();

    sandbox.tell(
      load(
        `globalThis.valencePlugin = { pages: { home: { render: () => ({ blocks: [{ type: 'text', text: [typeof require, typeof process, typeof fetch, typeof XMLHttpRequest, typeof WebAssembly, typeof setTimeout, typeof globalThis.__valenceHost].join(',') }] }) } } };`,
      ),
    );
    await sandbox.next('loaded');
    sandbox.tell({ type: 'invoke', id: 4, handler: 'page.render', args: '{"id":"home"}' });

    const answer = await sandbox.next('answer');

    expect(answer.type === 'answer' ? answer.value : '').toContain(
      'undefined,undefined,undefined,undefined,undefined,undefined,undefined',
    );
  });

  it('stops a plugin that never stops, and closes', async () => {
    const sandbox = await start();

    sandbox.tell(
      load(
        `globalThis.valencePlugin = { pages: { home: { render: () => { while (true) {} } } } };`,
      ),
    );
    await sandbox.next('loaded');
    sandbox.tell({ type: 'invoke', id: 5, handler: 'page.render', args: '{"id":"home"}' });

    const answer = await sandbox.next('answer');

    expect(answer).toMatchObject({ ok: false });
    expect(answer.type === 'answer' ? answer.error : '').toMatch(/interrupted/i);
    expect((await sandbox.next('stopped')).type).toBe('stopped');
    expect(sandbox.closedWith()).toBe(1);
  });

  it('stops a plugin that eats its memory', async () => {
    const sandbox = await start();

    sandbox.tell(
      load(
        `globalThis.valencePlugin = { pages: { home: { render: () => { const kept = []; while (true) kept.push('x'.repeat(100000)); } } } };`,
      ),
    );
    await sandbox.next('loaded');
    sandbox.tell({ type: 'invoke', id: 6, handler: 'page.render', args: '{"id":"home"}' });

    const answer = await sandbox.next('answer');

    expect(answer.type === 'answer' ? answer.error : '').toMatch(/memory|interrupted/i);
  });

  it('refuses to load code that throws, or that never defines itself', async () => {
    const throwing = await start();

    throwing.tell(load('throw new Error("broken at the top")'));
    const failed = await throwing.next('loadFailed');

    expect(failed.type === 'loadFailed' ? failed.problem : '').toContain('broken at the top');

    const empty = await start();

    empty.tell(load('const nothing = 1;'));
    expect(await empty.next('loadFailed')).toMatchObject({
      problem: 'The plugin never called definePlugin.',
    });
  });

  it('answers that nothing is loaded before a load, and ignores what it cannot read', async () => {
    const sandbox = await start();

    sandbox.tell({ type: 'invoke', id: 7, handler: 'describe', args: '{}' });
    expect(await sandbox.next('answer')).toMatchObject({
      ok: false,
      error: 'The plugin is not loaded.',
    });

    sandbox.tell({ type: 'hostAnswer', id: 99, ok: true, value: '1' });
    expect(sandbox.heard).toHaveLength(0);
  });

  it('keeps a plugin from replacing the way it is called', async () => {
    const sandbox = await start();

    sandbox.tell(
      load(`try { globalThis.__valenceInvoke = () => 'hijacked'; } catch (e) {}
      globalThis.valencePlugin = { pages: { home: { render: () => ({ blocks: [] }) } } };`),
    );
    await sandbox.next('loaded');
    sandbox.tell({ type: 'invoke', id: 8, handler: 'page.render', args: '{"id":"home"}' });

    expect(await sandbox.next('answer')).toMatchObject({ ok: true, value: '{"blocks":[]}' });
  });

  it('says so when asked for a page the plugin does not have', async () => {
    const sandbox = await start();

    sandbox.tell(load(PAGE));
    await sandbox.next('loaded');
    sandbox.tell({ type: 'invoke', id: 9, handler: 'page.render', args: '{"id":"missing"}' });

    const missing = await sandbox.next('answer');

    expect(missing).toMatchObject({ ok: false });
    expect(missing.type === 'answer' ? missing.error : '').toContain('nothing called missing');
  });
});
