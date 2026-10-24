import { describe, expect, it } from 'vitest';
import { keysNamedIn } from './keysNamedIn';

const KEYS = [
  'common.save',
  'common.cancel',
  'ui.siteFooter.gitHub',
  'client.items.countItems.one',
  'client.items.countItems.other',
  'docs.unused.label',
];

describe('keysNamedIn', () => {
  it('finds the keys a source names in any quotes, and nothing it does not', () => {
    const code = `say('common.save'); say("ui.siteFooter.gitHub"); const x = \`common.cancel\`; 'not.a.key';`;

    expect([...keysNamedIn(code, KEYS)].toSorted()).toEqual([
      'common.cancel',
      'common.save',
      'ui.siteFooter.gitHub',
    ]);
  });

  it('keeps the forms beneath a counted key the source names', () => {
    expect([...keysNamedIn(`sayCount('client.items.countItems', n)`, KEYS)].toSorted()).toEqual([
      'client.items.countItems.one',
      'client.items.countItems.other',
    ]);
  });
});
