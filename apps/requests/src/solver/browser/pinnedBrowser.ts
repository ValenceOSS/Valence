import type { BrowserPin } from './BrowserPin';

const UBLOCK_ORIGIN_VERSION = /ublock_origin-(?<version>[\d.]+)\.xpi$/u;

/**
 * Reads one ARG default from the Dockerfile.
 *
 * @param dockerfile - The contents of the Dockerfile.
 * @param name - The ARG to read.
 * @returns Its default.
 * @throws If the Dockerfile no longer declares it.
 */
const argOf = (dockerfile: string, name: string): string => {
  const found = new RegExp(`^ARG\\s+${name}=(?<value>\\S+)\\s*$`, 'mu').exec(dockerfile)?.groups?.[
    'value'
  ];

  if (found === undefined) {
    throw new Error(
      `The requests Dockerfile declares no ARG ${name}, so there is no pin to fetch.`,
    );
  }

  return found;
};

/**
 * Reads the Camoufox release and the uBlock Origin build the requests image is pinned to.
 *
 * The Dockerfile is the source of truth, as it is for FFmpeg, because the image cannot read a pin
 * from anywhere else. Development reads the same lines, so it runs the browser the image ships.
 *
 * @param dockerfile - The contents of the requests Dockerfile.
 * @returns The pinned Camoufox release and uBlock Origin download.
 * @throws If a pin is missing, or the uBlock Origin download names no version.
 */
const pinnedBrowser = (dockerfile: string): BrowserPin => {
  const ublockOriginUrl = argOf(dockerfile, 'UBLOCK_ORIGIN_URL');
  const ublockOriginVersion = UBLOCK_ORIGIN_VERSION.exec(ublockOriginUrl)?.groups?.['version'];

  if (ublockOriginVersion === undefined) {
    throw new Error(`UBLOCK_ORIGIN_URL names no version: ${ublockOriginUrl}`);
  }

  return {
    camoufoxVersion: argOf(dockerfile, 'CAMOUFOX_VERSION'),
    camoufoxRelease: argOf(dockerfile, 'CAMOUFOX_RELEASE'),
    ublockOriginUrl,
    ublockOriginVersion,
  };
};

export { pinnedBrowser };
