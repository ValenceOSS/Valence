import { vi } from 'vitest';
import { listen } from '@tauri-apps/api/event';
import type { EventCallback } from '@tauri-apps/api/event';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type FakeHostsEvents = {
  emit: (event: string, payload: JsonValue) => void;
  listening: (event: string) => number;
  unlisten: ReturnType<typeof vi.fn>;
};

/**
 * Answers a mocked `listen` with a stand-in host whose events a test can raise.
 *
 * @returns The way to raise an event, to count who listens for one, and what stopping calls.
 */
const fakeTheHostsEvents = (): FakeHostsEvents => {
  const listeners = new Map<string, Set<EventCallback<JsonValue>>>();
  const unlisten = vi.fn();

  vi.mocked(listen).mockImplementation((event: string, handler: EventCallback<JsonValue>) => {
    const heard = listeners.get(event) ?? new Set();

    heard.add(handler);
    listeners.set(event, heard);

    return Promise.resolve(() => {
      heard.delete(handler);
      unlisten(event);
    });
  });

  return {
    emit: (event, payload) => {
      for (const handler of listeners.get(event) ?? []) {
        handler({ event, id: 0, payload });
      }
    },
    listening: (event) => listeners.get(event)?.size ?? 0,
    unlisten,
  };
};

export { fakeTheHostsEvents };
