import { describe, expect, it } from 'vitest';
import {
  IMPORT_PHASES,
  ImportCursorSchema,
  ImportRunOptionsSchema,
  ImportSourceDetailsSchema,
} from './ImportRecords';

describe('ImportRecords', () => {
  it('fills a source’s details in from nothing, as an older row holds', () => {
    expect(ImportSourceDetailsSchema.parse({})).toEqual({
      serverId: '',
      version: '0',
      clientId: '',
      userTokens: {},
      pathMappings: [],
    });
  });

  it('fills a run’s options in from nothing', () => {
    expect(ImportRunOptionsSchema.parse({})).toEqual({ skipUserIds: [], meUserId: null, by: null });
  });

  it('reads a cursor at the start of a phase, and refuses one in a phase it does not know', () => {
    expect(ImportCursorSchema.parse({ phase: 'viewing' })).toEqual({ phase: 'viewing', index: 0 });
    expect(ImportCursorSchema.safeParse({ phase: 'somewhere', index: 1 }).success).toBe(false);
    expect(ImportCursorSchema.safeParse({ phase: 'viewing', index: -1 }).success).toBe(false);
  });

  it('works through the phases in order and ends on done', () => {
    expect(IMPORT_PHASES.at(0)).toBe('accounts');
    expect(IMPORT_PHASES.at(-1)).toBe('done');
  });
});
