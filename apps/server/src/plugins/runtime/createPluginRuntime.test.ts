import { describe, expect, it, vi } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { createPluginRuntime } from './createPluginRuntime';
import type {
  CreatePluginSandboxOptions,
  PluginSandbox,
} from '@ValenceServer/plugins/sandbox/createPluginSandbox';
import type { BrokerScope } from '@ValenceServer/plugins/broker/BrokerScope';
import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';

const RECORD: InstalledRecord = {
  id: 'runtime-test',
  version: '1.0.0',
  trust: 'official',
  manifest: PluginManifestSchema.parse({
    manifestVersion: 2,
    id: 'runtime-test',
    name: 'Runtime Test',
    version: '1.0.0',
    apiVersion: '^1.0',
    author: { name: 'Tester' },
    description: 'Runs.',
    entry: 'dist/plugin.js',
    contributes: { pages: [{ id: 'home', title: 'Home', placement: 'account' }] },
  }),
  packageBase64: '',
  sha256: 'a'.repeat(64),
  isEnabled: true,
  settings: {},
  installedBy: null,
  installedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  problem: null,
  previousVersion: null,
};

const SCOPE: BrokerScope = { kind: 'background' };

const aSandbox = () => {
  const stop = vi.fn<() => void>();
  const sandbox: PluginSandbox<BrokerScope> = {
    invoke: vi.fn(() => Promise.resolve('"answered"')),
    stop,
    isRunning: () => true,
  };

  return Object.assign(sandbox, { stop });
};

describe('keeping plugins running', () => {
  it('starts a plugin the first time it is needed, and keeps using it', async () => {
    const sandbox = aSandbox();
    const start = vi.fn(() => Promise.resolve(sandbox));
    const runtime = createPluginRuntime({
      brokerFor: () => vi.fn(),
      onProblem: vi.fn(),
      onLog: vi.fn(),
      start,
    });

    expect(runtime.stateOf(RECORD.id)).toBe('idle');
    expect(await runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE)).toBe(
      '"answered"',
    );
    await runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE);

    expect(start).toHaveBeenCalledTimes(1);
    expect(runtime.stateOf(RECORD.id)).toBe('running');
  });

  it('starts it again when the plugin or its settings change', async () => {
    const first = aSandbox();
    const second = aSandbox();
    const start = vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const runtime = createPluginRuntime({
      brokerFor: () => vi.fn(),
      onProblem: vi.fn(),
      onLog: vi.fn(),
      start,
    });

    await runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE);
    await runtime.invoke(
      { record: { ...RECORD, updatedAt: '2026-02-01T00:00:00.000Z' }, code: 'x' },
      'describe',
      {},
      SCOPE,
    );

    expect(start).toHaveBeenCalledTimes(2);
    expect(first.stop).toHaveBeenCalled();
  });

  it('leaves a plugin that failed to start alone for a while, then tries again', async () => {
    let clock = 0;
    const onProblem = vi.fn();
    const start = vi
      .fn<
        (options: CreatePluginSandboxOptions<BrokerScope>) => Promise<PluginSandbox<BrokerScope>>
      >()
      .mockRejectedValueOnce(new Error('The plugin never called definePlugin.'))
      .mockResolvedValueOnce(aSandbox());
    const runtime = createPluginRuntime({
      brokerFor: () => vi.fn(),
      onProblem,
      onLog: vi.fn(),
      start,
      now: () => clock,
    });

    await expect(
      runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE),
    ).rejects.toThrow('never called definePlugin');
    await vi.waitFor(() => {
      expect(onProblem).toHaveBeenCalledWith(RECORD.id, 'The plugin never called definePlugin.');
    });
    expect(runtime.stateOf(RECORD.id)).toBe('failed');
    await expect(
      runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE),
    ).rejects.toThrow('never called definePlugin');
    expect(start).toHaveBeenCalledTimes(1);

    clock = 2000;

    expect(await runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE)).toBe(
      '"answered"',
    );
    expect(start).toHaveBeenCalledTimes(2);
  });

  it('counts a sandbox that stops on its own as a failure, and passes logs on', async () => {
    const onProblem = vi.fn();
    const onLog = vi.fn();
    let stopped: ((reason: string) => void) | undefined;
    const start = vi.fn((options: CreatePluginSandboxOptions<BrokerScope>) => {
      stopped = options.onStopped;
      options.onLog?.('warn', 'careful');

      return Promise.resolve(aSandbox());
    });
    const runtime = createPluginRuntime({ brokerFor: () => vi.fn(), onProblem, onLog, start });

    await runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE);
    stopped?.('InternalError: interrupted');

    expect(onProblem).toHaveBeenCalledWith(RECORD.id, 'InternalError: interrupted');
    expect(onLog).toHaveBeenCalledWith(RECORD.id, 'warn', 'careful');
    expect(runtime.stateOf(RECORD.id)).toBe('failed');
  });

  it('stops one plugin, or all of them', async () => {
    const sandbox = aSandbox();
    const runtime = createPluginRuntime({
      brokerFor: () => vi.fn(),
      onProblem: vi.fn(),
      onLog: vi.fn(),
      start: () => Promise.resolve(sandbox),
    });

    await runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE);
    runtime.stop(RECORD.id);
    await vi.waitFor(() => {
      expect(sandbox.stop).toHaveBeenCalledTimes(1);
    });
    expect(runtime.stateOf(RECORD.id)).toBe('idle');

    await runtime.invoke({ record: RECORD, code: 'x' }, 'describe', {}, SCOPE);
    runtime.stopAll();
    await vi.waitFor(() => {
      expect(sandbox.stop).toHaveBeenCalledTimes(2);
    });
  });
});
