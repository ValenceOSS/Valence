import { invoke } from '@tauri-apps/api/core';
import type { InvokeArgs } from '@tauri-apps/api/core';

/**
 * Sends the host a command without waiting on its answer, as a message the page has nothing to do
 * with afterwards.
 *
 * @param command - The host's command.
 * @param args - What goes with it.
 */
const tellTheHost = (command: string, args?: InvokeArgs): void => {
  void invoke(command, args).catch(() => undefined);
};

export { tellTheHost };
