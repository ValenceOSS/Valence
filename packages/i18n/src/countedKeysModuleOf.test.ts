import { describe, expect, it } from 'vitest';
import { countedKeysModuleOf } from './countedKeysModuleOf';

describe('countedKeysModuleOf', () => {
  it('lists every string said once of one thing and once of several, by its name alone', () => {
    expect(
      countedKeysModuleOf({
        'common.count.files.one': '{count} file',
        'common.count.files.other': '{count} files',
        'common.cancel': 'Cancel',
        'common.count.lonely.other': 'only ever several',
      }),
    ).toBe('const COUNTED_KEYS = ["common.count.files"] as const;\n\nexport { COUNTED_KEYS };\n');
  });
});
