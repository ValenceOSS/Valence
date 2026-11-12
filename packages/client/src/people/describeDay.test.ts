import { describe, expect, it } from 'vitest';
import { describeDay } from './describeDay';

describe('describeDay', () => {
  it('writes a date the way somebody says it', () => {
    const said = describeDay('1974-08-20');

    expect(said).toContain('August');
    expect(said).toContain('20');
    expect(said).toContain('1974');
    expect(said).not.toContain('08');
  });

  it('says the day the date names in a time zone west of it', () => {
    const was = process.env.TZ;

    process.env.TZ = 'America/Los_Angeles';

    try {
      expect(describeDay('1974-08-20')).toContain('20');
      expect(describeDay('1974-08-20')).not.toContain('19,');
    } finally {
      process.env.TZ = was;
    }
  });

  it('leaves out a date it could not read rather than showing it back', () => {
    expect(describeDay('the seventies')).toBeNull();
  });

  it('says nothing where there is no date', () => {
    expect(describeDay(null)).toBeNull();
    expect(describeDay(undefined)).toBeNull();
  });
});
