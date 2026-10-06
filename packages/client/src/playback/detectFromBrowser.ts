import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import { say } from '@ValenceI18n/say';
import type { BrowsersMedia } from '@ValenceClient/playback/BrowsersMedia';
import type { CodecProbe } from '@ValenceClient/playback/CodecProbe';
import { detectDeviceProfile } from '@ValenceClient/playback/detectDeviceProfile';

const STEREO = 2;

/**
 * Asks the current output device how many channels it accepts, which is the only part of an audio
 * profile a browser will answer.
 *
 * It describes the device rather than the browser, so it is read once when the profile is built and
 * goes stale the moment somebody plugs in headphones or connects a receiver. That is a worse answer
 * than renegotiating on every device change and a far better one than the two this used to assume.
 *
 * @param page - The browser's window.
 * @returns What the output accepts, never fewer than two.
 */
const channelsTheOutputAccepts = (page: BrowsersMedia): number => {
  if (page.AudioContext === undefined) {
    return STEREO;
  }

  try {
    const context = new page.AudioContext();
    const accepted = context.destination.maxChannelCount;

    void context.close();

    return accepted;
  } catch {
    return STEREO;
  }
};

/**
 * Asks the browser which containers, codecs and ranges it can actually play, by testing each rather
 * than by reading its name — the web app's browser and a television's alike.
 *
 * @param page - The browser's window.
 * @param video - A video element, asked what it plays from a file.
 * @param name - What to call this device in the session list.
 * @returns What this browser can play.
 */
const detectFromBrowser = (
  page: BrowsersMedia,
  video: { canPlayType: (mimeType: string) => string },
  name = say('common.browser'),
): DeviceProfile => {
  const source = page.MediaSource;
  const isTypeSupported: CodecProbe =
    source !== undefined && typeof source.isTypeSupported === 'function'
      ? (mimeType) => source.isTypeSupported(mimeType)
      : () => false;

  return detectDeviceProfile({
    isTypeSupported,
    canPlayFile: (mimeType) => video.canPlayType(mimeType) !== '',
    platform: page.navigator.platform,
    supportsHdr: page.matchMedia?.('(dynamic-range: high)').matches ?? false,
    screenWidth: Math.round(page.screen.width * page.devicePixelRatio),
    screenHeight: Math.round(page.screen.height * page.devicePixelRatio),
    name,
    maxAudioChannels: channelsTheOutputAccepts(page),
  });
};

export { detectFromBrowser };
