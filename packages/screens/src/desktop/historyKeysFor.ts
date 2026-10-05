/**
 * The keys that go back and forward through a desktop window's history, as each platform's own
 * applications use them: command and a square bracket on a Mac, alt and an arrow everywhere else.
 *
 * @param platform - Which operating system the window is on, as Node names it.
 * @returns The keys for each way, one to a cap.
 */
const historyKeysFor = (
  platform: string | undefined,
): { back: readonly string[]; forward: readonly string[] } =>
  platform === 'darwin'
    ? { back: ['⌘', '['], forward: ['⌘', ']'] }
    : { back: ['Alt', '←'], forward: ['Alt', '→'] };

export { historyKeysFor };
