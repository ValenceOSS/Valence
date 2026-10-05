import { describe, expect, it } from 'vitest';
import { withholdFromTheDemo } from './withholdFromTheDemo';

describe('withholdFromTheDemo', () => {
  it('takes away handing out share links and keeps everything else', () => {
    expect([
      ...withholdFromTheDemo(new Set(['sharing.link', 'sharing.party', 'streaming.view'])),
    ]).toEqual(['sharing.party', 'streaming.view']);
  });
});
