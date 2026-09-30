import { saidBySandbox } from '@ValenceServer/plugins/sandbox/saidBySandbox';
import { saying } from '@ValenceI18n/saying';
import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';
import { fork } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { FromSandboxSchema } from './SandboxProtocol';
import { sandboxEntryPath } from './sandboxEntryPath';
import type { FromSandbox, SandboxHandler, ToSandbox } from './SandboxProtocol';
import { say } from '@ValenceI18n/say';

type SandboxLimits = {
  memoryBytes: number;
  cpuMilliseconds: number;
  wallMilliseconds: number;
};

type CreatePluginSandboxOptions<TScope> = {
  plugin: { id: string; version: string };
  code: string;
  methods: readonly string[];
  onHostCall: (method: string, args: string, scope: TScope | null) => Promise<string>;
  onLog?: (level: 'info' | 'warn' | 'error', message: string) => void;
  onStopped?: (reason: Said) => void;
  limits?: Partial<SandboxLimits>;
  spawn?: () => ChildProcess;
};

type PluginSandbox<TScope> = {
  invoke: (handler: SandboxHandler, args: object, scope: TScope) => Promise<string>;
  stop: () => void;
  isRunning: () => boolean;
};

const DEFAULT_LIMITS: SandboxLimits = {
  memoryBytes: 64 * 1024 * 1024,
  cpuMilliseconds: 5000,
  wallMilliseconds: 30_000,
};

const LOAD_PATIENCE_MILLISECONDS = 15_000;

/**
 * Starts the process a plugin runs in, the way the server does it: Node's permission model on, so
 * the process can read only its own folder and the modules it loads, and can write nothing, start
 * nothing and open no workers; a heap of its own that cannot grow into the server's; an
 * environment holding nothing of the server's.
 *
 * @returns The process.
 */
const spawnSandbox = (): ChildProcess => {
  const { entry, readable } = sandboxEntryPath();

  return fork(entry, ['--valence-plugin-sandbox'], {
    execArgv: [
      '--permission',
      ...readable.map((path) => `--allow-fs-read=${path}`),
      '--max-old-space-size=160',
      '--disable-warning=ExperimentalWarning',
    ],
    env: { NODE_ENV: 'production' },
    stdio: ['ignore', 'ignore', 'pipe', 'ipc'],
    serialization: 'json',
  });
};

/**
 * Runs a plugin in a process of its own, inside QuickJS within that process, and carries every
 * question the plugin asks of Valence back to the broker. Resolves once the plugin has loaded;
 * refuses where it cannot.
 *
 * Every invocation carries a scope, meaning who it is being run for, and each question the plugin
 * asks while that invocation is running is handed to the broker with that scope, so a viewer's page
 * acts only for that viewer. A question asked after its invocation has finished carries no scope.
 *
 * An invocation that the plugin never answers is given up on after the wall clock runs out, and a
 * sandbox that stops — because it was asked to, crashed, or ran out of time or memory — fails
 * everything still waiting on it.
 *
 * @param options - The plugin, its code, the host methods it may call, and how to answer them.
 * @returns The running sandbox.
 */
const createPluginSandbox = <TScope>(
  options: CreatePluginSandboxOptions<TScope>,
): Promise<PluginSandbox<TScope>> => {
  const limits = { ...DEFAULT_LIMITS, ...options.limits };
  const child = (options.spawn ?? spawnSandbox)();
  const waiting = new Map<
    number,
    { resolve: (value: string) => void; reject: (error: Error) => void }
  >();
  const scopes = new Map<number, TScope>();

  let nextInvocation = 0;
  let isRunning = true;

  const tell = (message: ToSandbox): void => {
    if (isRunning && child.connected) {
      child.send(JSON.stringify(message));
    }
  };

  const failEverything = (reason: Said): void => {
    for (const [, pending] of waiting) {
      pending.reject(new SaidError(reason));
    }

    waiting.clear();
    scopes.clear();
  };

  return new Promise((resolve, reject) => {
    let isLoaded = false;

    const loading = setTimeout(() => {
      if (!isLoaded) {
        child.kill('SIGKILL');
        reject(new Error('The plugin took too long to start.'));
      }
    }, LOAD_PATIENCE_MILLISECONDS);

    const sandbox: PluginSandbox<TScope> = {
      invoke: (handler, args, scope) =>
        new Promise((resolveCall, rejectCall) => {
          if (!isRunning) {
            rejectCall(new Error('The plugin is not running.'));

            return;
          }

          const id = nextInvocation;
          const timeout = setTimeout(() => {
            waiting.delete(id);
            scopes.delete(id);
            rejectCall(new Error('The plugin took too long to answer.'));
          }, limits.wallMilliseconds);

          nextInvocation += 1;
          scopes.set(id, scope);
          waiting.set(id, {
            resolve: (value) => {
              clearTimeout(timeout);
              scopes.delete(id);
              resolveCall(value);
            },
            reject: (error) => {
              clearTimeout(timeout);
              scopes.delete(id);
              rejectCall(error);
            },
          });
          tell({ type: 'invoke', id, handler, args: JSON.stringify(args) });
        }),
      stop: () => {
        if (isRunning) {
          isRunning = false;
          child.kill('SIGKILL');
          failEverything(saying('server.sandbox.pluginSandbox.thePluginWasStopped'));
        }
      },
      isRunning: () => isRunning,
    };

    const hear = async (message: FromSandbox): Promise<void> => {
      switch (message.type) {
        case 'loaded':
          isLoaded = true;
          clearTimeout(loading);
          resolve(sandbox);

          return;
        case 'loadFailed':
          clearTimeout(loading);
          sandbox.stop();
          reject(new SaidError(saidBySandbox(message.problem)));

          return;
        case 'answer': {
          const pending = waiting.get(message.id);

          waiting.delete(message.id);

          if (message.ok) {
            pending?.resolve(message.value ?? 'null');
          } else {
            pending?.reject(new SaidError(saidBySandbox(message.error ?? { kind: 'failed' })));
          }

          return;
        }
        case 'hostCall':
          try {
            tell({
              type: 'hostAnswer',
              id: message.id,
              ok: true,
              value: await options.onHostCall(
                message.method,
                message.args,
                scopes.get(message.invocation) ?? null,
              ),
            });
          } catch (error) {
            tell({
              type: 'hostAnswer',
              id: message.id,
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : say('server.sandbox.pluginSandbox.valenceRefusedThat'),
            });
          }

          return;
        case 'log':
          options.onLog?.(message.level, message.message);

          return;
        case 'stopped':
          isRunning = false;
          options.onStopped?.(saidBySandbox(message.reason));
          failEverything(saidBySandbox(message.reason));

          return;
      }
    };

    child.on('message', (raw) => {
      if (typeof raw !== 'string') {
        return;
      }

      let read: ReturnType<typeof FromSandboxSchema.safeParse>;

      try {
        read = FromSandboxSchema.safeParse(JSON.parse(raw));
      } catch {
        return;
      }

      if (read.success) {
        void hear(read.data);
      }
    });

    child.on('exit', (code) => {
      const wasRunning = isRunning;

      isRunning = false;
      clearTimeout(loading);
      failEverything(saying('server.sandbox.pluginSandbox.thePluginStopped'));

      if (!isLoaded) {
        reject(new Error(`The plugin's process ended before it loaded (${String(code)}).`));
      } else if (wasRunning) {
        options.onStopped?.(
          saying('server.sandbox.pluginSandbox.thePluginsProcessEndedCode', {
            code: String(code),
          }),
        );
      }
    });

    child.on('error', () => {
      sandbox.stop();
    });

    tell({
      type: 'load',
      code: options.code,
      plugin: options.plugin,
      methods: [...options.methods],
      memoryBytes: limits.memoryBytes,
      cpuMilliseconds: limits.cpuMilliseconds,
    });
  });
};

export type { CreatePluginSandboxOptions, PluginSandbox, SandboxLimits };

export { createPluginSandbox };
