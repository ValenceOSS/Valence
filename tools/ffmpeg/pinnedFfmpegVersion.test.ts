import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pinnedFfmpegVersion } from './pinnedFfmpegVersion';

const ROOT = join(import.meta.dirname, '..', '..');

const CI_VERSIONS = /^\s*VALENCE_FFMPEG_VERSION:\s*(?<version>\S+)\s*$/gmu;

describe('pinnedFfmpegVersion', () => {
  it('reads the version the image is pinned to', () => {
    expect(pinnedFfmpegVersion('ARG VALENCE_FFMPEG_VERSION=8.1.2-5.2\n')).toBe('8.1.2-5.2');
  });

  it('ignores a mention that is not the declaration', () => {
    const dockerfile = [
      '# VALENCE_FFMPEG_VERSION=9.9.9 would be a comment, not a pin',
      'ARG VALENCE_FFMPEG_VERSION=8.1.2-5.2',
    ].join('\n');

    expect(pinnedFfmpegVersion(dockerfile)).toBe('8.1.2-5.2');
  });

  it('refuses to guess when the declaration is gone', () => {
    expect(() => pinnedFfmpegVersion('FROM debian:bookworm\n')).toThrow(
      /no ARG VALENCE_FFMPEG_VERSION/u,
    );
  });

  it.each(['media-pipeline.yml', 'release.yml'])(
    'agrees with every version %s installs',
    (name) => {
      const dockerfile = readFileSync(join(ROOT, 'docker', 'server.Dockerfile'), 'utf8');
      const workflow = readFileSync(join(ROOT, '.github', 'workflows', name), 'utf8');
      const versions = [...workflow.matchAll(CI_VERSIONS)].map(
        (found) => found.groups?.['version'],
      );

      expect(versions.length).toBeGreaterThan(0);
      expect(new Set(versions)).toEqual(new Set([pinnedFfmpegVersion(dockerfile)]));
    },
  );
});
