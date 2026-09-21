import { LOG_LEVELS, LOG_SOURCES } from '@ValenceContracts/schemas/Log';
import type { LogLevel, LogSource } from '@ValenceContracts/schemas/Log';

type ParsedLogSearch = {
  levels: LogLevel[];
  sources: LogSource[];
  jobKinds: string[];
  ids: {
    jobId?: string;
    libraryId?: string;
    mediaId?: string;
    sessionId?: string;
    requestId?: string;
  };
  text: string;
};

const ID_KEYS = new Map<string, keyof ParsedLogSearch['ids']>([
  ['job', 'jobId'],
  ['library', 'libraryId'],
  ['media', 'mediaId'],
  ['session', 'sessionId'],
  ['request', 'requestId'],
]);

const TOKEN = /(?:[^\s"]+:)?"[^"]*"|\S+/g;

const isLevel = (value: string): value is LogLevel => LOG_LEVELS.some((level) => level === value);

const isSource = (value: string): value is LogSource =>
  LOG_SOURCES.some((source) => source === value);

/**
 * Reads what somebody typed into the search box the way a log explorer does: a word that names a
 * field and a value — `level:error`, `source:jobs`, `kind:library.scan`, `job:abc123`, `library:…`,
 * `media:…`, `session:…`, `request:…` — narrows to that field, and anything else is text to look
 * for. A value may be quoted to keep spaces in it.
 *
 * A field that is not one of these, or a value that field cannot hold, is left as text rather than
 * discarded, so what was typed is never silently lost.
 *
 * @param typed - The contents of the search box.
 * @returns The fields it named, and the text that remains.
 */
const parseLogSearch = (typed: string): ParsedLogSearch => {
  const parsed: ParsedLogSearch = { levels: [], sources: [], jobKinds: [], ids: {}, text: '' };
  const text: string[] = [];

  for (const token of typed.match(TOKEN) ?? []) {
    const colon = token.indexOf(':');
    const key = colon < 1 ? '' : token.slice(0, colon).toLowerCase();
    const value = token.slice(colon + 1).replace(/^"|"$/g, '');
    const idField = ID_KEYS.get(key);
    const lowered = value.toLowerCase();

    if (colon < 1 || value === '') {
      text.push(token);
    } else if (key === 'level' && isLevel(lowered)) {
      parsed.levels.push(lowered);
    } else if (key === 'source' && isSource(lowered)) {
      parsed.sources.push(lowered);
    } else if (key === 'kind') {
      parsed.jobKinds.push(value);
    } else if (idField !== undefined) {
      parsed.ids[idField] = value;
    } else {
      text.push(token);
    }
  }

  parsed.text = text.join(' ');

  return parsed;
};

export type { ParsedLogSearch };

export { parseLogSearch };
