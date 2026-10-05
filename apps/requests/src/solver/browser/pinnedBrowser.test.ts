import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pinnedBrowser } from './pinnedBrowser';

const DOCKERFILE = [
  'FROM node:24.21.0-bookworm-slim AS browser',
  '# ARG CAMOUFOX_VERSION=999.0.0 would be a comment, not a pin',
  'ARG CAMOUFOX_VERSION=152.0.4',
  'ARG CAMOUFOX_RELEASE=beta.30',
  'ARG UBLOCK_ORIGIN_URL=https://addons.mozilla.org/firefox/downloads/file/5034826/ublock_origin-1.75.0.xpi',
  'ARG UBLOCK_ORIGIN_SHA256=5b74415860456370644bd80f16125e865b0e6c356bb5dfcfb84069967eaa5287',
].join('\n');

describe('pinnedBrowser', () => {
  it('reads the Camoufox release and the uBlock Origin build the image is pinned to', () => {
    expect(pinnedBrowser(DOCKERFILE)).toEqual({
      camoufoxVersion: '152.0.4',
      camoufoxRelease: 'beta.30',
      ublockOriginUrl:
        'https://addons.mozilla.org/firefox/downloads/file/5034826/ublock_origin-1.75.0.xpi',
      ublockOriginVersion: '1.75.0',
      ublockOriginSha256: '5b74415860456370644bd80f16125e865b0e6c356bb5dfcfb84069967eaa5287',
    });
  });

  it('refuses to guess when a pin is gone', () => {
    expect(() => pinnedBrowser(DOCKERFILE.replace('ARG CAMOUFOX_RELEASE=beta.30', ''))).toThrow(
      /no ARG CAMOUFOX_RELEASE/u,
    );
  });

  it('refuses a uBlock Origin download that names no version', () => {
    const dockerfile = DOCKERFILE.replace(
      /ublock_origin-1\.75\.0\.xpi/u,
      'latest/ublock-origin/latest.xpi',
    );

    expect(() => pinnedBrowser(dockerfile)).toThrow(/names no version/u);
  });

  it('reads the pins from the requests Dockerfile itself', () => {
    const dockerfile = readFileSync(
      join(import.meta.dirname, '..', '..', '..', 'Dockerfile'),
      'utf8',
    );

    expect(pinnedBrowser(dockerfile).camoufoxVersion).toMatch(/^\d+\.\d+\.\d+$/u);
  });
});
