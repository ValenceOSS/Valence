import { say } from '@ValenceI18n/say';

const REQUESTS_VIEWS = [
  { id: 'discover', label: say('common.discover') },
  { id: 'film:popular', label: say('common.movies') },
  { id: 'series:popular', label: say('common.shows') },
  { id: 'music', label: say('common.music') },
  { id: 'books', label: say('common.books') },
  { id: 'mine', label: say('common.requests') },
] as const;

export { REQUESTS_VIEWS };
