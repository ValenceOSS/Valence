import { app } from 'electron';

const LOWEST_PORT = 1024;

const HIGHEST_PORT = 65535;

/**
 * Opens Chrome's remote debugging on the port named by `VALENCE_DEBUG_PORT`, so a script can drive
 * the app and read its memory, as the leak sweep does. Without the variable, or with a port that is
 * not one, nothing is opened. It has to run before the app is ready.
 *
 * @param asked - The port asked for, as the environment holds it.
 * @returns Whether a port was opened.
 */
const openTheDebuggingPort = (
  asked: string | undefined = process.env['VALENCE_DEBUG_PORT'],
): boolean => {
  const port = Number(asked);

  if (!Number.isInteger(port) || port < LOWEST_PORT || port > HIGHEST_PORT) {
    return false;
  }

  app.commandLine.appendSwitch('remote-debugging-port', port.toString());

  return true;
};

export { openTheDebuggingPort };
