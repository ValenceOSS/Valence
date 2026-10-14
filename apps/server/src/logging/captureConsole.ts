type ConsoleStream = 'stdout' | 'stderr';

type CapturedConsole = {
  asOwn: (write: () => void) => void;
};

/**
 * Hears everything this process writes to its console that did not come through Valence's own
 * logger — warnings from Node, libraries that print, a stack trace written on the way down — and
 * hands it on a line at a time, still writing it to the console as before. Lines the logger writes
 * itself are passed over, since the logger has already kept them.
 *
 * @param onLine - Told each line, and which stream it was written to.
 * @returns A way for the logger to write without being heard.
 */
const captureConsole = (onLine: (line: string, stream: ConsoleStream) => void): CapturedConsole => {
  let isOwn = false;
  const partial: Record<ConsoleStream, string> = { stdout: '', stderr: '' };

  const hear = (stream: ConsoleStream, chunk: string | Uint8Array) => {
    if (isOwn) {
      return;
    }

    const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    const lines = (partial[stream] + text).split('\n');

    partial[stream] = lines.pop() ?? '';

    for (const line of lines) {
      const said = line.trimEnd();

      if (said !== '') {
        onLine(said, stream);
      }
    }
  };

  for (const stream of ['stdout', 'stderr'] as const) {
    const target = process[stream];
    const original = target.write.bind(target);

    target.write = (
      chunk: string | Uint8Array,
      encodingOrDone?: BufferEncoding | ((failure?: Error | null) => void),
      done?: (failure?: Error | null) => void,
    ): boolean => {
      hear(stream, chunk);

      return typeof encodingOrDone === 'function'
        ? original(chunk, encodingOrDone)
        : original(chunk, encodingOrDone, done);
    };
  }

  return {
    asOwn: (write) => {
      isOwn = true;

      try {
        write();
      } finally {
        isOwn = false;
      }
    },
  };
};

export type { CapturedConsole, ConsoleStream };

export { captureConsole };
