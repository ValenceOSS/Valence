import { say } from '@ValenceI18n/say';

const CANCELLED = new Set(['NotAllowedError', 'AbortError']);

const SAID = new Map([
  ['InvalidStateError', say('desktop.main.whatWindowsSaid.thisDeviceAlreadyHasAPasskey')],
  ['NotSupportedError', say('desktop.main.whatWindowsSaid.thisDeviceCannotMakeTheKind')],
  ['SecurityError', say('desktop.main.whatWindowsSaid.windowsWouldNotUseAPasskey')],
]);

/**
 * Reads a refusal from Windows, which the native module names the way a browser would.
 *
 * `NotAllowedError` is how Windows says somebody closed its prompt or let it time out, which is
 * somebody changing their mind rather than anything going wrong, so it is not something to show.
 *
 * @param error - What the native module threw.
 * @returns That it was cancelled, or why it failed.
 */
const whatWindowsSaid = (
  error: Error | null,
): { kind: 'cancelled' } | { kind: 'failed'; reason: string } => {
  const name = error?.message ?? '';

  if (CANCELLED.has(name)) {
    return { kind: 'cancelled' };
  }

  return {
    kind: 'failed',
    reason: SAID.get(name) ?? say('desktop.main.whatWindowsSaid.windowsCouldNotUseAPasskey'),
  };
};

export { whatWindowsSaid };
