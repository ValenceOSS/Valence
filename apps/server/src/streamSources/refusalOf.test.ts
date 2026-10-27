import { describe, expect, it } from 'vitest';
import { REMOTE_REFUSAL_REASONS } from '@ValenceSDK/remoteFiles/REMOTE_REFUSAL_REASONS';
import { refusalOf } from './refusalOf';

describe('refusalOf', () => {
  it('says every reason a source refuses, naming it, with the problem a player shows', () => {
    const refused = REMOTE_REFUSAL_REASONS.map((reason) => refusalOf(reason, 'Example files'));

    expect(refused.map((one) => one.problem)).toEqual([
      'sourceNotReady',
      'sourceLimit',
      'sourceArchive',
      'sourceNoFile',
      'sourceTooBig',
      'sourceUnreachable',
      'sourceNotSetUp',
      'sourceUnreachable',
    ]);
    expect(refused.every((one) => one.said.message.includes('Example files'))).toBe(true);
  });
});
