import { LOG_LEVELS } from '@ValenceContracts/schemas/Log';
import type { LogView } from './logView.types';

const LOG_PAGE_SIZE = 200;

/**
 * What the log explorer shows before anybody has asked for anything: the last day, every level,
 * newest first.
 */
const defaultLogView = (): LogView => ({
  range: '24h',
  zoom: null,
  levels: [...LOG_LEVELS],
  sources: [],
  jobKinds: [],
  ids: {},
  search: '',
  sort: 'newest',
  limit: LOG_PAGE_SIZE,
});

export { defaultLogView, LOG_PAGE_SIZE };
