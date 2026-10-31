const EVENT_TOPICS = [
  'playback.started',
  'playback.paused',
  'playback.resumed',
  'playback.progress',
  'playback.stopped',
  'playback.finished',
  'session.started',
  'session.ended',
  'media.added',
  'media.removed',
  'library.scanned',
  'requests.made',
  'requests.approved',
  'requests.refused',
  'requests.available',
  'profile.removed',
] as const;

export { EVENT_TOPICS };
