import { createPluginSandbox } from '@ValenceServer/plugins/sandbox/createPluginSandbox';
import { HOST_METHODS } from '@ValenceServer/plugins/broker/HOST_METHODS';
import type {
  PluginSandbox,
  CreatePluginSandboxOptions,
} from '@ValenceServer/plugins/sandbox/createPluginSandbox';
import type { SandboxHandler } from '@ValenceServer/plugins/sandbox/SandboxProtocol';
import type { BrokerScope } from '@ValenceServer/plugins/broker/BrokerScope';
import type { PluginBroker } from '@ValenceServer/plugins/broker/createPluginBroker';
import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';

type RunnablePlugin = { record: InstalledRecord; code: string };

type CreatePluginRuntimeOptions = {
  brokerFor: (record: InstalledRecord) => PluginBroker;
  onProblem: (pluginId: string, problem: string) => void;
  onLog: (pluginId: string, level: 'info' | 'warn' | 'error', message: string) => void;
  start?: (options: CreatePluginSandboxOptions<BrokerScope>) => Promise<PluginSandbox<BrokerScope>>;
  now?: () => number;
};

type PluginRuntime = {
  invoke: (
    plugin: RunnablePlugin,
    handler: SandboxHandler,
    args: object,
    scope: BrokerScope,
  ) => Promise<string>;
  stop: (pluginId: string) => void;
  stateOf: (pluginId: string) => 'running' | 'idle' | 'failed';
  stopAll: () => void;
};

const FIRST_BACK_OFF_MILLISECONDS = 1000;

const LONGEST_BACK_OFF_MILLISECONDS = 5 * 60 * 1000;

/**
 * Keeps each installed plugin's sandbox: started the first time the plugin is needed, rather than
 * with the server, so an installed plugin nobody uses costs nothing; started again when the plugin
 * or its settings change; and, when it fails, left alone for a while that doubles each time, so a
 * broken plugin cannot keep the server busy starting it.
 *
 * @param options - How to answer a plugin's questions, and where to report what went wrong.
 * @returns The runtime.
 */
const createPluginRuntime = ({
  brokerFor,
  onProblem,
  onLog,
  start = createPluginSandbox,
  now = Date.now,
}: CreatePluginRuntimeOptions): PluginRuntime => {
  const running = new Map<
    string,
    { stamp: string; sandbox: Promise<PluginSandbox<BrokerScope>> }
  >();
  const failures = new Map<string, { count: number; retryAt: number; problem: string }>();

  const fail = (pluginId: string, problem: string): void => {
    const was = failures.get(pluginId);
    const count = (was?.count ?? 0) + 1;

    failures.set(pluginId, {
      count,
      retryAt:
        now() +
        Math.min(FIRST_BACK_OFF_MILLISECONDS * 2 ** (count - 1), LONGEST_BACK_OFF_MILLISECONDS),
      problem,
    });
    running.delete(pluginId);
    onProblem(pluginId, problem);
  };

  const sandboxFor = (plugin: RunnablePlugin): Promise<PluginSandbox<BrokerScope>> => {
    const { record } = plugin;
    const stamp = `${record.version}:${record.updatedAt}:${record.sha256}`;
    const current = running.get(record.id);

    if (current !== undefined && current.stamp === stamp) {
      return current.sandbox;
    }

    if (current !== undefined) {
      void current.sandbox.then((sandbox) => {
        sandbox.stop();
      });
      running.delete(record.id);
    }

    const failed = failures.get(record.id);

    if (failed !== undefined && failed.retryAt > now()) {
      return Promise.reject(new Error(failed.problem));
    }

    const broker = brokerFor(record);
    const sandbox = start({
      plugin: { id: record.id, version: record.version },
      code: plugin.code,
      methods: HOST_METHODS,
      onHostCall: broker,
      onLog: (level, message) => {
        onLog(record.id, level, message);
      },
      onStopped: (reason) => {
        if (running.get(record.id)?.stamp === stamp) {
          fail(record.id, reason);
        }
      },
    });

    running.set(record.id, { stamp, sandbox });

    sandbox.then(
      () => {
        failures.delete(record.id);
      },
      (error) => {
        if (running.get(record.id)?.stamp === stamp) {
          fail(record.id, error instanceof Error ? error.message : 'The plugin would not start.');
        }
      },
    );

    return sandbox;
  };

  return {
    invoke: async (plugin, handler, args, scope) => {
      const sandbox = await sandboxFor(plugin);

      return sandbox.invoke(handler, args, scope);
    },
    stop: (pluginId) => {
      const current = running.get(pluginId);

      running.delete(pluginId);
      failures.delete(pluginId);
      void current?.sandbox.then(
        (sandbox) => {
          sandbox.stop();
        },
        () => undefined,
      );
    },
    stateOf: (pluginId) => {
      if (running.has(pluginId)) {
        return 'running';
      }

      return failures.has(pluginId) ? 'failed' : 'idle';
    },
    stopAll: () => {
      for (const pluginId of running.keys()) {
        const current = running.get(pluginId);

        running.delete(pluginId);
        void current?.sandbox.then(
          (sandbox) => {
            sandbox.stop();
          },
          () => undefined,
        );
      }
    },
  };
};

export type { CreatePluginRuntimeOptions, PluginRuntime, RunnablePlugin };

export { createPluginRuntime };
