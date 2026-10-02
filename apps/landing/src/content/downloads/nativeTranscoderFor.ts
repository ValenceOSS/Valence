import { DOCS_URL } from '@ValenceLanding/content/DOCS_URL';
import type { Platform } from './Platform';

type NativeTranscoder = { label: string; url: string };

/**
 * Where a visitor on a Mac or a Windows PC reads how to transcode in hardware there, which takes the
 * transcoder running natively beside the server; nothing for anyone else, since Linux passes the GPU
 * into the container and a phone runs no server.
 *
 * @param platform - What the visitor is on.
 * @returns The page to link to, or nothing.
 */
const nativeTranscoderFor = (platform: Platform): NativeTranscoder | null => {
  if (platform === 'mac') {
    return {
      label: 'Hardware transcoding on a Mac',
      url: `${DOCS_URL}/install/hardware-transcoding-on-a-mac`,
    };
  }

  if (platform === 'windows') {
    return {
      label: 'Hardware transcoding on Windows',
      url: `${DOCS_URL}/install/hardware-transcoding-on-windows`,
    };
  }

  return null;
};

export type { NativeTranscoder };

export { nativeTranscoderFor };
