import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { matchesCondition } from './matchesCondition';
import type { FormatCondition } from '@ValenceContracts/schemas/QualityProfile';

const TITLE = 'Dune.2021.2160p.WEB-DL.DV.HDR10.DDP5.1.Atmos.H.265-FLUX';
const GB = 1024 ** 3;

/**
 * Whether the release meets a condition of the kind and value given.
 */
const meets = (
  kind: FormatCondition['kind'],
  value: string,
  isNegated = false,
  sizeBytes: number | null = 12 * GB,
) =>
  matchesCondition(
    { kind, value, isNegated, isRequired: false },
    { title: TITLE, sizeBytes },
    parseReleaseName(TITLE),
  );

describe('matchesCondition', () => {
  it('reads words, the group, the codec, HDR, the source and the resolution', () => {
    expect(meets('words', 'Atmos')).toBe(true);
    expect(meets('words', '/\\bddp5\\.1\\b/')).toBe(true);
    expect(meets('group', 'flux')).toBe(true);
    expect(meets('codec', 'h265')).toBe(true);
    expect(meets('hdr', 'dolbyVision')).toBe(true);
    expect(meets('source', 'webdl')).toBe(true);
    expect(meets('resolution', '2160p')).toBe(true);
    expect(meets('resolution', '1080p')).toBe(false);
  });

  it('reads a size between two, in gigabytes, only where the size is known', () => {
    expect(meets('size', '10-20')).toBe(true);
    expect(meets('size', '-10')).toBe(false);
    expect(meets('size', '30-')).toBe(false);
    expect(meets('size', '10-20', false, null)).toBe(false);
  });

  it('turns a negated condition round', () => {
    expect(meets('codec', 'h264', true)).toBe(true);
    expect(meets('language', 'fr', true)).toBe(true);
  });
});
