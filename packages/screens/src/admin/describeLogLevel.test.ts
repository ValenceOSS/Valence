import { describe, expect, it } from 'vitest';
import { LOG_LEVELS } from '@ValenceContracts/schemas/Log';
import { describeLogLevel } from './describeLogLevel';

describe('describeLogLevel', () => {
  it('gives every level its own words, tone and colour', () => {
    const looks = LOG_LEVELS.map((level) => describeLogLevel(level));

    expect(new Set(looks.map((look) => look.label)).size).toBe(4);
    expect(new Set(looks.map((look) => look.tone)).size).toBe(4);
    expect(new Set(looks.map((look) => look.colour)).size).toBe(4);
  });

  it('paints the serious ones in the colours that mean trouble', () => {
    expect(describeLogLevel('error').tone).toBe('danger');
    expect(describeLogLevel('warn').tone).toBe('warning');
  });
});
