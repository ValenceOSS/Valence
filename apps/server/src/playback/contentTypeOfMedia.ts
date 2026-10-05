const TYPES: Readonly<Record<string, string>> = {
  ts: 'video/mp2t',
  m4s: 'video/mp4',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  alac: 'audio/mp4',
  aac: 'audio/aac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  wav: 'audio/wav',
  wma: 'audio/x-ms-wma',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
  ape: 'audio/x-ape',
  wv: 'audio/x-wavpack',
};

/**
 * The content type a media file is sent with, by its extension, matching what the media service
 * sends so a player sees the same file the same way from either. Anything else, Matroska included,
 * goes as plain bytes, which a browser reads by looking at the file itself.
 *
 * @param path - The file.
 * @returns Its content type.
 */
const contentTypeOfMedia = (path: string): string => {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';

  return TYPES[extension] ?? 'application/octet-stream';
};

export { contentTypeOfMedia };
