import type { Platform } from './Platform';

type NavigatorLike = {
  userAgent: string;
  maxTouchPoints?: number;
  userAgentData?: { platform?: string } | undefined;
};

/**
 * Works out what a visitor is browsing on, so the download they are offered first is the one that
 * runs there. The browser's own platform hint is trusted where it gives one, and the user agent
 * otherwise. An iPad that says it is a Mac is told apart by its touch screen.
 *
 * @param from - The browser's navigator, or anything shaped like it.
 * @returns The platform, or unknown where nothing says.
 */
const detectPlatform = (from: NavigatorLike): Platform => {
  const hinted = from.userAgentData?.platform?.toLowerCase() ?? '';
  const agent = from.userAgent.toLowerCase();
  const said = `${hinted} ${agent}`;

  if (/android/u.test(said)) {
    return 'android';
  }

  if (/iphone|ipad|ipod|\bios\b/u.test(said)) {
    return 'iphone';
  }

  if (/mac/u.test(said)) {
    return (from.maxTouchPoints ?? 0) > 1 ? 'iphone' : 'mac';
  }

  if (/win/u.test(said)) {
    return 'windows';
  }

  if (/linux|x11|cros/u.test(said)) {
    return 'linux';
  }

  return 'unknown';
};

export { detectPlatform };
