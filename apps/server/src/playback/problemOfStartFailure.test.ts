import { describe, expect, it } from 'vitest';
import { TranscoderError } from '@ValenceServer/transcoder/TranscoderClient';
import { problemOfStartFailure } from './problemOfStartFailure';

/**
 * A failure carrying a system code, as Node's network errors do.
 *
 * @param code - The code.
 * @returns The failure.
 */
const failing = (code: string): Error => Object.assign(new Error('connect failed'), { code });

describe('problemOfStartFailure', () => {
  it('says the converter is not running where the media service does not answer', () => {
    expect(
      problemOfStartFailure(new TypeError('fetch failed', { cause: failing('ECONNREFUSED') })),
    ).toBe('converterDown');
    expect(problemOfStartFailure(failing('ENOENT'))).toBe('converterDown');
  });

  it('says the file is missing or cannot be opened where the media service says so', () => {
    expect(problemOfStartFailure(new TranscoderError('rejected', 404))).toBe('missing');
    expect(problemOfStartFailure(new TranscoderError('rejected', 403))).toBe('unreadable');
  });

  it('says only that something went wrong for anything else', () => {
    expect(problemOfStartFailure(new TranscoderError('rejected', 500))).toBe('unknown');
    expect(problemOfStartFailure(new Error('boom'))).toBe('unknown');
  });
});
