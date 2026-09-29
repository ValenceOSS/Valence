import type { RealtimeEvent, RealtimeTopic } from '@ValenceContracts/schemas/Realtime';

/**
 * A socket that says nothing until a test says it did, and remembers what it was asked to stop
 * listening to.
 *
 * @returns The socket to hand a hook, a way to say something on it, and a way to reconnect it.
 */
const aFakeSocket = () => {
  const listeners = new Map<string, (event: RealtimeEvent) => void>();
  const stopped: string[] = [];
  let onResume = (): void => undefined;

  return {
    stopped,
    say: (topic: string, event: RealtimeEvent) => {
      listeners.get(topic)?.(event);
    },
    reconnect: () => {
      onResume();
    },
    client: {
      subscribe: (topic: RealtimeTopic, listen: (event: RealtimeEvent) => void) => {
        listeners.set(topic, listen);

        return () => {
          stopped.push(topic);
        };
      },
      onResumed: (run: () => void) => {
        onResume = run;

        return () => {
          stopped.push('resumed');
        };
      },
    },
  };
};

export { aFakeSocket };
