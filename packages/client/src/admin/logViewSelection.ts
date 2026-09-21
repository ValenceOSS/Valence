import type { LogView } from './logView.types';

const quoted = (value: string): string => (/\s/.test(value) ? `"${value}"` : value);

/**
 * The name a filter goes by, in the same words the search box understands, so a chip and a phrase
 * typed into the box are the same thing.
 *
 * @param key - Which field it filters.
 * @param value - What it filters that field to.
 * @returns The filter's name.
 */
const logFilterId = (key: string, value: string): string => `${key}:${quoted(value)}`;

/**
 * Every filter a view has, by name, for a menu to tick and a row of chips to show.
 *
 * @param view - What the explorer is showing.
 * @returns The names of its filters.
 */
const logViewSelection = (view: LogView): Set<string> =>
  new Set([
    ...view.levels.map((level) => logFilterId('level', level)),
    ...view.sources.map((source) => logFilterId('source', source)),
    ...view.jobKinds.map((kind) => logFilterId('kind', kind)),
    ...(view.ids.jobId === undefined ? [] : [logFilterId('job', view.ids.jobId)]),
    ...(view.ids.libraryId === undefined ? [] : [logFilterId('library', view.ids.libraryId)]),
    ...(view.ids.mediaId === undefined ? [] : [logFilterId('media', view.ids.mediaId)]),
    ...(view.ids.sessionId === undefined ? [] : [logFilterId('session', view.ids.sessionId)]),
    ...(view.ids.requestId === undefined ? [] : [logFilterId('request', view.ids.requestId)]),
  ]);

export { logViewSelection, logFilterId };
