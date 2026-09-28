import { getQuickJS } from 'quickjs-emscripten';
import type { QuickJSContext, QuickJSDeferredPromise, QuickJSHandle } from 'quickjs-emscripten';
import { ToSandboxSchema } from './SandboxProtocol.ts';
import type { FromSandbox, ToSandbox } from './SandboxProtocol.ts';

type SandboxChannel = {
  send: (message: FromSandbox) => void;
  listen: (listener: (text: string) => void) => void;
  close: (code: number) => void;
};

type Loaded = {
  vm: QuickJSContext;
  invoke: QuickJSHandle;
};

const PRELUDE = `
(() => {
  const host = globalThis.__valenceHost;
  const methods = JSON.parse(globalThis.__valenceMethods);
  const plugin = JSON.parse(globalThis.__valencePlugin);
  delete globalThis.__valenceHost;
  delete globalThis.__valenceMethods;
  delete globalThis.__valencePlugin;
  const makeValence = (invocation) => {
    const call = (method, args) =>
      host(method, JSON.stringify(args === undefined ? [] : args), invocation).then((text) => JSON.parse(text));
    const made = { plugin: Object.freeze({ id: plugin.id, version: plugin.version }) };
    for (const path of methods) {
      const parts = path.split('.');
      let at = made;
      for (const part of parts.slice(0, -1)) {
        if (at[part] === undefined) at[part] = {};
        at = at[part];
      }
      at[parts[parts.length - 1]] = (...args) => call(path, args);
    }
    return freeze(made);
  };
  const freeze = (value) => {
    if (value !== null && typeof value === 'object') {
      for (const key of Object.keys(value)) freeze(value[key]);
      Object.freeze(value);
    }
    return value;
  };
  const quiet = makeValence(-1);
  const say = (level) => (...parts) => {
    if (quiet.log !== undefined) quiet.log[level](parts.map((part) => typeof part === 'string' ? part : JSON.stringify(part)).join(' '));
  };
  globalThis.console = Object.freeze({ log: say('info'), info: say('info'), warn: say('warn'), error: say('error') });
  const within = (table, id) => {
    const found = table === undefined ? undefined : table[id];
    if (found === undefined) throw new Error('This plugin has nothing called ' + id + '.');
    return found;
  };
  const invoke = async (handler, argsText, invocation) => {
    const definition = globalThis.valencePlugin;
    const args = JSON.parse(argsText);
    const valence = makeValence(invocation);
    const context = { valence, viewer: args.viewer === undefined ? null : args.viewer, subject: args.subject === undefined ? null : args.subject };
    let result;
    if (handler === 'describe') {
      result = {
        pages: Object.keys(definition.pages || {}),
        panels: Object.keys(definition.panels || {}),
        schedules: Object.keys(definition.schedules || {}),
        events: typeof definition.events === 'function',
        accountConnected: typeof definition.onAccountConnected === 'function',
      };
    } else if (handler === 'page.render') {
      result = await within(definition.pages, args.id).render(context);
    } else if (handler === 'page.act') {
      const page = within(definition.pages, args.id);
      result = page.act === undefined ? undefined : await page.act(context, args.request);
    } else if (handler === 'panel.render') {
      result = await within(definition.panels, args.id).render(context);
    } else if (handler === 'panel.act') {
      const panel = within(definition.panels, args.id);
      result = panel.act === undefined ? undefined : await panel.act(context, args.request);
    } else if (handler === 'schedule') {
      await within(definition.schedules, args.id)({ valence });
    } else if (handler === 'event') {
      if (typeof definition.events === 'function') await definition.events(args.event, { valence });
    } else if (handler === 'accountConnected') {
      if (typeof definition.onAccountConnected === 'function') await definition.onAccountConnected({ valence }, args.connection);
    }
    return JSON.stringify(result === undefined ? null : result);
  };
  Object.defineProperty(globalThis, '__valenceInvoke', { value: invoke, writable: false, configurable: false, enumerable: false });
})();
`;

const MOST_ERROR_CHARACTERS = 500;

/**
 * Reads what went wrong inside the sandbox as a sentence, from the error's own name and message,
 * without trusting it to be an error at all.
 *
 * @param vm - The sandbox.
 * @param handle - What was thrown.
 * @returns The sentence, cut short where a plugin wrote an essay.
 */
const sayWhatWasThrown = (vm: QuickJSContext, handle: QuickJSHandle): string => {
  if (vm.typeof(handle) === 'string') {
    return vm.getString(handle).slice(0, MOST_ERROR_CHARACTERS);
  }

  if (vm.typeof(handle) !== 'object') {
    return 'The plugin failed.';
  }

  const read = (key: string): string => {
    const property = vm.getProp(handle, key);
    const text = vm.typeof(property) === 'string' ? vm.getString(property) : '';

    property.dispose();

    return text;
  };
  const name = read('name');
  const message = read('message');

  return (
    (name === '' ? message : `${name}: ${message}`).slice(0, MOST_ERROR_CHARACTERS) ||
    'The plugin failed.'
  );
};

/**
 * Whether a failure means the sandbox itself can no longer be trusted to carry on — a plugin that
 * ran out of time or memory — rather than an ordinary error its code threw.
 *
 * @param problem - The failure, as a sentence.
 * @returns Whether to stop the sandbox.
 */
const isFatal = (problem: string): boolean =>
  /interrupted|out of memory|stack overflow/i.test(problem);

/**
 * Runs one plugin inside QuickJS, compiled to WebAssembly, for the process it was started in. The
 * plugin's code can reach nothing of Node: no `require`, no `process`, no files, no network, no
 * timers. What it gets is the `valence` object in its handlers' context, whose every method is a
 * message to the parent, which decides whether the plugin may do what it asked.
 *
 * Each time control enters the sandbox it has a fixed budget of time before it is interrupted, and
 * the sandbox has a fixed budget of memory. A plugin that exhausts either is not trusted to carry
 * on: the sandbox says so and closes, and the parent starts a fresh one.
 *
 * @param channel - How this sandbox talks to the process that owns it.
 * @returns Once it is listening.
 */
const runPluginSandbox = async (channel: SandboxChannel): Promise<void> => {
  const quickjs = await getQuickJS();
  const waitingForHost = new Map<number, QuickJSDeferredPromise>();

  let loaded: Loaded | null = null;
  let nextHostCall = 0;
  let cpuMilliseconds = 1000;

  const stop = (reason: string): void => {
    channel.send({ type: 'stopped', reason });
    channel.close(1);
  };

  const enter = <T>(vm: QuickJSContext, run: () => T): T => {
    const deadline = Date.now() + cpuMilliseconds;

    vm.runtime.setInterruptHandler(() => Date.now() > deadline);

    return run();
  };

  const runJobs = (vm: QuickJSContext): void => {
    const ran = enter(vm, () => vm.runtime.executePendingJobs());

    if (ran.error !== undefined) {
      const problem = sayWhatWasThrown(vm, ran.error);

      ran.error.dispose();

      if (isFatal(problem)) {
        stop(problem);
      }
    }
  };

  const load = (message: Extract<ToSandbox, { type: 'load' }>): void => {
    const vm = quickjs.newContext();

    cpuMilliseconds = message.cpuMilliseconds;
    vm.runtime.setMemoryLimit(message.memoryBytes);
    vm.runtime.setMaxStackSize(1024 * 1024);

    const host = vm.newFunction('host', (methodHandle, argsHandle, invocationHandle) => {
      const id = nextHostCall;
      const deferred = vm.newPromise();

      nextHostCall += 1;
      waitingForHost.set(id, deferred);
      void deferred.settled.then(() => {
        runJobs(vm);
      });
      channel.send({
        type: 'hostCall',
        id,
        invocation: vm.typeof(invocationHandle) === 'number' ? vm.getNumber(invocationHandle) : -1,
        method: vm.getString(methodHandle),
        args: vm.getString(argsHandle),
      });

      return deferred.handle;
    });

    vm.setProp(vm.global, '__valenceHost', host);
    host.dispose();

    for (const [name, value] of [
      ['__valenceMethods', JSON.stringify(message.methods)],
      ['__valencePlugin', JSON.stringify(message.plugin)],
    ] as const) {
      const text = vm.newString(value);

      vm.setProp(vm.global, name, text);
      text.dispose();
    }

    for (const [source, filename] of [
      [PRELUDE, 'valence-prelude.js'],
      [message.code, 'plugin.js'],
    ] as const) {
      const evaluated = enter(vm, () => vm.evalCode(source, filename));

      if (evaluated.error !== undefined) {
        const problem = sayWhatWasThrown(vm, evaluated.error);

        evaluated.error.dispose();
        vm.dispose();
        channel.send({ type: 'loadFailed', problem });

        return;
      }

      evaluated.value.dispose();
      runJobs(vm);
    }

    const definition = vm.getProp(vm.global, 'valencePlugin');
    const isDefined = vm.typeof(definition) === 'object';

    definition.dispose();

    if (!isDefined) {
      vm.dispose();
      channel.send({ type: 'loadFailed', problem: 'The plugin never called definePlugin.' });

      return;
    }

    loaded = { vm, invoke: vm.getProp(vm.global, '__valenceInvoke') };
    channel.send({ type: 'loaded' });
  };

  const invoke = (message: Extract<ToSandbox, { type: 'invoke' }>): void => {
    if (loaded === null) {
      channel.send({
        type: 'answer',
        id: message.id,
        ok: false,
        error: 'The plugin is not loaded.',
      });

      return;
    }

    const { vm, invoke: invokeHandle } = loaded;
    const handler = vm.newString(message.handler);
    const args = vm.newString(message.args);
    const invocation = vm.newNumber(message.id);
    const called = enter(vm, () =>
      vm.callFunction(invokeHandle, vm.undefined, handler, args, invocation),
    );

    handler.dispose();
    args.dispose();
    invocation.dispose();

    if (called.error !== undefined) {
      const problem = sayWhatWasThrown(vm, called.error);

      called.error.dispose();
      channel.send({ type: 'answer', id: message.id, ok: false, error: problem });

      if (isFatal(problem)) {
        stop(problem);
      }

      return;
    }

    const settling = vm.resolvePromise(called.value);

    called.value.dispose();
    runJobs(vm);

    void settling.then((outcome) => {
      if (outcome.error !== undefined) {
        const problem = sayWhatWasThrown(vm, outcome.error);

        outcome.error.dispose();
        channel.send({ type: 'answer', id: message.id, ok: false, error: problem });

        if (isFatal(problem)) {
          stop(problem);
        }

        return;
      }

      const value = vm.typeof(outcome.value) === 'string' ? vm.getString(outcome.value) : 'null';

      outcome.value.dispose();
      channel.send({ type: 'answer', id: message.id, ok: true, value });
    });
  };

  const answer = (message: Extract<ToSandbox, { type: 'hostAnswer' }>): void => {
    const deferred = waitingForHost.get(message.id);

    if (deferred === undefined || loaded === null) {
      return;
    }

    const { vm } = loaded;

    waitingForHost.delete(message.id);

    if (message.ok) {
      const value = vm.newString(message.value ?? 'null');

      deferred.resolve(value);
      value.dispose();
    } else {
      const error = vm.newError(message.error ?? 'Valence refused that.');

      deferred.reject(error);
      error.dispose();
    }

    deferred.dispose();
  };

  channel.listen((text) => {
    let read: ReturnType<typeof ToSandboxSchema.safeParse>;

    try {
      read = ToSandboxSchema.safeParse(JSON.parse(text));
    } catch {
      return;
    }

    if (!read.success) {
      return;
    }

    switch (read.data.type) {
      case 'load':
        load(read.data);
        break;
      case 'invoke':
        invoke(read.data);
        break;
      case 'hostAnswer':
        answer(read.data);
        break;
    }
  });
};

if (process.argv.includes('--valence-plugin-sandbox') && process.send !== undefined) {
  void runPluginSandbox({
    send: (message) => {
      process.send?.(JSON.stringify(message));
    },
    listen: (listener) => {
      process.on('message', (message) => {
        if (typeof message === 'string') {
          listener(message);
        }
      });
    },
    close: (code) => {
      process.exit(code);
    },
  });

  process.on('disconnect', () => {
    process.exit(0);
  });
}

export type { SandboxChannel };

export { runPluginSandbox };
