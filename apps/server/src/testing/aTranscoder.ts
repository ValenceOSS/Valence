import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

/**
 * A media service for a test, answering nothing it is not told to: everything a test leaves out
 * refuses or answers with nothing, so a test names only what it leans on.
 *
 * @param overrides - What this test needs the media service to do.
 * @returns The media service.
 */
const aTranscoder = (overrides: Partial<Transcoder> = {}): Transcoder => ({
  isReachable: () => Promise.resolve(true),
  measureCache: () => Promise.resolve(null),
  sweepPreviews: () => Promise.reject(new Error('not used')),
  forgetPreview: () => Promise.reject(new Error('not used')),
  requestDownload: () => Promise.reject(new Error('not used')),
  requestRendition: () => Promise.reject(new Error('not used')),
  stopRendition: () => Promise.resolve(false),
  forgetRendition: () => Promise.resolve(false),
  readDownloadFile: () => Promise.reject(new Error('not used')),
  stopDownload: () => Promise.reject(new Error('not used')),
  forgetDownload: () => Promise.reject(new Error('not used')),
  forgetTrickplay: () => Promise.reject(new Error('not used')),
  sweepTrickplay: () => Promise.reject(new Error('not used')),
  probe: () => Promise.reject(new Error('not used')),
  startSession: () => Promise.reject(new Error('not used')),
  readSessionFile: () => Promise.resolve(null),
  readFile: () => Promise.resolve(null),
  readAudioRendition: () => Promise.resolve(null),
  fingerprint: () => Promise.reject(new Error('not used')),
  requestTrickplay: () => Promise.reject(new Error('not used')),
  readTrickplayFile: () => Promise.resolve(null),
  stopSession: () => Promise.resolve(true),
  heartbeatSession: () => Promise.resolve(true),
  listFonts: () => Promise.resolve([]),
  readFont: () => Promise.resolve(new ArrayBuffer(0)),
  readSubtitle: () => Promise.reject(new Error('not used')),
  readFrame: () => Promise.reject(new Error('not used')),
  requestPreview: () => Promise.reject(new Error('not used')),
  readPreviewFile: () => Promise.resolve(null),
  readMonitor: () => Promise.resolve({}),
  openMonitorSocket: () => Promise.resolve(null),
  capabilities: () => Promise.reject(new Error('not used')),
  ...overrides,
});

export { aTranscoder };
